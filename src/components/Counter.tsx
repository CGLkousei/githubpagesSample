'use client';

import { useState, useCallback } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const triggerAnimation = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  const increment = () => {
    setCount((prev) => prev + 1);
    triggerAnimation();
  };

  const decrement = () => {
    setCount((prev) => prev - 1);
    triggerAnimation();
  };

  const reset = () => {
    setCount(0);
    triggerAnimation();
  };

  return (
    <div className="app-wrapper">
      {/* 背景のグロー装飾 */}
      <div className="glow glow-1" />
      <div className="glow glow-2" />

      <div className="counter-card">
        <h1 className="counter-title">Counter</h1>
        <p className="counter-subtitle">React + Next.js で作るカウンターアプリ</p>

        <div className={`counter-display ${isAnimating ? 'pulse' : ''}`}>
          <span className="counter-value">{count}</span>
        </div>

        <div className="button-group">
          <button
            className="counter-btn btn-decrement"
            onClick={decrement}
            aria-label="カウントを減らす"
          >
            −
          </button>
          <button
            className="counter-btn btn-reset"
            onClick={reset}
            aria-label="カウントをリセット"
          >
            Reset
          </button>
          <button
            className="counter-btn btn-increment"
            onClick={increment}
            aria-label="カウントを増やす"
          >
            ＋
          </button>
        </div>

        <p className="counter-hint">ボタンをクリックして値を操作できます</p>
      </div>
    </div>
  );
}
