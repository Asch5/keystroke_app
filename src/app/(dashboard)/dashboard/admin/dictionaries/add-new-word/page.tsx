import PageWrapper from '@/components/ui/pageWrapper';
import AddNewWordForm from '@/components/ui/dashboard/dictionary/add-new-word/addNewWord-form';
import CheckWordForm from '@/components/ui/dashboard/dictionary/add-new-word/checkWord-form';
export default function AddNewWord() {
    return (
        <PageWrapper title="Add New Word From Merriam Webster">
            <AddNewWordForm />
            <CheckWordForm />
        </PageWrapper>
    );
}
