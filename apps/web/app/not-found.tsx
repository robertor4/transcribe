import { redirect } from 'next/navigation';

export default function RootNotFound() {
  // Redirect to localized 404 page
  redirect('/en');
}