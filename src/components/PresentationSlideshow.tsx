import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from 'lucide-react';
import type { DiagnosticResult } from '../types/diagnostic';
import PresentationSlide from './PresentationSlide';

interface PresentationSlideshowProps {
  result: DiagnosticResult;
  onClose: () => void;
}

const SLIDE_DURATION = 8000; // 8 segundos por slide

function PresentationSlideshow({ result, onClose }: PresentationSlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // URL fixa da logo do Cloudinary
  const logoUrl = 'https://res.cloudinary.com/ducd9j4tx/image/upload/v1751168925/Ativo_26_-_Azul_branco_x3quzd.svg';

  const slides = [
    'intro',
    'company-info',
    'score-overview',
    'pillars-performance',
    'maturity-level',
    'recommendations',
    'conclusion'
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            nextSlide();
            return 0;
          }
          return prev + (100 / (SLIDE_DURATION / 100));
        });
      }, 100);
    } else {
      setProgress(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoPlaying, currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setProgress(0);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setProgress(0);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
    if (!isAutoPlaying) {
      setProgress(0);
    }
  };

  const resetPresentation = () => {
    setCurrentSlide(0);
    setIsAutoPlaying(false);
    setProgress(0);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
        e.preventDefault();
        nextSlide();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        prevSlide();
        break;
      case 'Escape':
        onClose();
        break;
      case 'Home':
        e.preventDefault();
        goToSlide(0);
        break;
      case 'End':
        e.preventDefault();
        goToSlide(slides.length - 1);
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header de Controle */}
      <div className="bg-zinc-900 p-4 flex items-center justify-between border-b border-zinc-700">
        <div className="flex items-center gap-4">
          <img
            src={logoUrl}
            alt="Logo"
            className="h-8 w-auto object-contain"
          />
          <div className="text-white">
            <h3 className="font-medium">{result.companyData.empresa}</h3>
            <p className="text-sm text-gray-400">
              Slide {currentSlide + 1} de {slides.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetPresentation}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Reiniciar apresentação"
          >
            <RotateCcw size={20} />
          </button>
          
          <button
            onClick={toggleAutoPlay}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            title={isAutoPlaying ? "Pausar" : "Reproduzir automaticamente"}
          >
            {isAutoPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <div className="w-px h-6 bg-zinc-700"></div>

          <button
            onClick={prevSlide}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Slide anterior"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={nextSlide}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Próximo slide"
          >
            <ChevronRight size={20} />
          </button>

          <div className="w-px h-6 bg-zinc-700"></div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Fechar apresentação"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Barra de Progresso */}
      {isAutoPlaying && (
        <div className="h-1 bg-zinc-800">
          <div
            className="h-full bg-blue-600 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Slide Atual */}
      <div className="flex-1 relative">
        <PresentationSlide
          type={slides[currentSlide]}
          result={result}
          slideNumber={currentSlide + 1}
          totalSlides={slides.length}
        />
      </div>

      {/* Navegação por Pontos */}
      <div className="bg-zinc-900 p-4 flex items-center justify-center gap-2 border-t border-zinc-700">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide
                ? 'bg-blue-600'
                : 'bg-zinc-600 hover:bg-zinc-500'
            }`}
            title={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default PresentationSlideshow;