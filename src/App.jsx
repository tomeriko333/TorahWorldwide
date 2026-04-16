import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import ReaderView from './components/ReaderView';
import PerushimView from './components/PerushimView';
import CustomCursor from './components/CustomCursor';

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
    </>
  );
}
