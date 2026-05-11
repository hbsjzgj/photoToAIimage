import { redirect } from 'next/navigation';

// Root path redirects to the default locale (Japanese)
export default function RootPage() {
  redirect('/ja');
}
