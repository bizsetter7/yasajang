import { redirect } from 'next/navigation';

// /admin/platform-settings → /admin/settings 리다이렉트
export default function PlatformSettingsPage() {
  redirect('/admin/settings');
}
