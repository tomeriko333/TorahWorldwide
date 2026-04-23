import { useState, lazy, Suspense } from 'react';
import HomeScreen from './components/HomeScreen';
import CustomCursor from './components/CustomCursor';

const ReaderView = lazy(() => import('./components/ReaderView'));
const PerushimView = lazy(() => import('./components/PerushimView'));

export default function App() {
  const [screen, setScreen] = useState('home');
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [initialVerse, setInitialVerse] = useState(null);

  const handleStart = (book, chapter, verse = null) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setInitialVerse(verse);
    setScreen('reader');
  };

  const handleNavigate = (book, chapter) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
  };

  const handleBack = () => setScreen('home');

  return (
    <>
      <CustomCursor />
      {screen === 'home' && <HomeScreen onStart={handleStart} onPerushim={() => setScreen('perushim')} />}
      <Suspense fallback={null}>
        {screen === 'perushim' && <PerushimView onBack={() => setScreen('home')} />}
        {screen === 'reader' && selectedBook && selectedChapter && (
          <ReaderView
            book={selectedBook}
            chapter={selectedChapter}
            initialVerse={initialVerse}
            onBack={handleBack}
            onNavigate={handleNavigate}
          />
        )}
      </Suspense>
    </>
  );
}
