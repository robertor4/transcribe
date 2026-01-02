import { redirect } from 'next/navigation';

// Account functionality has been merged into Profile page
export default function AccountSettingsPage() {
  redirect('/settings/profile');
}
