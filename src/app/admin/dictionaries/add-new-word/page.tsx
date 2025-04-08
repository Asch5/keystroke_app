import PageWrapper from '@/components/pageWrapper';
import AddNewWordForm from '@/components/forms/addNewWord-form';
import CheckWordForm from '@/components/forms/checkWord-form';
export default function AddNewWord() {
  return (
    <PageWrapper title="Add New Word From Merriam Webster">
      <AddNewWordForm />
      <CheckWordForm />
    </PageWrapper>
  );
}
