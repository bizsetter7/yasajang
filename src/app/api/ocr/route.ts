import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { imageUrl, docType } = await req.json();

        if (!imageUrl) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'OCR service is not configured' }, { status: 500 });
        }

        let base64Image = '';
        let mimeType = 'image/jpeg';

        if (imageUrl.startsWith('data:')) {
            const matches = imageUrl.match(/^data:([a-zA-Z0-9-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                mimeType = matches[1];
                base64Image = matches[2];
            } else {
                throw new Error('Invalid Data URI format');
            }
        } else {
            // Fetch the image from URL and convert to base64
            const imageRes = await fetch(imageUrl);
            if (!imageRes.ok) {
                throw new Error('Failed to fetch image for OCR');
            }
            const arrayBuffer = await imageRes.arrayBuffer();
            base64Image = Buffer.from(arrayBuffer).toString('base64');
            mimeType = imageRes.headers.get('content-type') || 'image/jpeg';
        }

        // Call Anthropic API
        const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 1000,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: mimeType === 'application/pdf' ? 'image/jpeg' : mimeType, // Haiku requires image
                                    data: base64Image
                                }
                            },
                            {
                                type: 'text',
                                text: docType === 'permit'
                                    ? "이 이미지는 한국 식품위생법상 영업허가증(또는 영업신고증)입니다.\n다음 항목을 JSON으로만 응답하세요 (설명 없이):\n{\n  \"license_number\": \"영업허가번호 또는 신고번호 (예: 제2023-서울강남-01234호)\",\n  \"floor_area\": \"영업장 면적 (예: 165.28㎡)\",\n  \"name\": \"업소명\",\n  \"representative\": \"대표자명\"\n}\n항목을 찾을 수 없으면 해당 필드를 null로 반환."
                                    : "이 이미지는 한국 사업자등록증입니다.\n다음 항목을 JSON으로만 응답하세요 (설명 없이):\n{\n  \"business_number\": \"사업자등록번호 (000-00-00000 형식)\",\n  \"name\": \"상호명\",\n  \"representative\": \"대표자명\",\n  \"open_date\": \"개업일 (YYYY-MM-DD)\",\n  \"business_type\": \"업태\"\n}\n항목을 찾을 수 없으면 해당 필드를 null로 반환."
                            }
                        ]
                    }
                ]
            })
        });

        if (!anthropicRes.ok) {
            const err = await anthropicRes.json();
            throw new Error(err.error?.message || 'OCR API failed');
        }

        const data = await anthropicRes.json();
        const textContent = data.content?.[0]?.text || '{}';
        
        // JSON 추출 (Markdown 블록 제거)
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : textContent;
        
        let parsed = {};
        try {
            parsed = JSON.parse(jsonString);
        } catch (e) {
            console.error('OCR JSON Parse error:', e, textContent);
        }

        return NextResponse.json({ success: true, data: parsed });

    } catch (error: any) {
        console.error('OCR error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
