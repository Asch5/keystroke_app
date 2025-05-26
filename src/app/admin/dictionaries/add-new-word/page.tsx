import { PageWrapper } from '@/components/layouts';
import { AddNewWordForm } from '@/components/features/dictionary';

export default function AddNewWord() {
  return (
    <PageWrapper title="Add New Word From Merriam Webster">
      <AddNewWordForm />
    </PageWrapper>
  );
}
