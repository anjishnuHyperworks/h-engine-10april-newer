import React, { useState, useRef, useEffect } from 'react';

const tooltipStyles = {
  tooltip: {
    position: 'fixed',
    backgroundColor: 'white',
    color: 'black',
    padding: '0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.85rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    zIndex: 1000000000000,
    pointerEvents: 'none',
    maxWidth: '25vw',
    textAlign: 'left',
    wordWrap: 'break-word',
  },
  arrow: {
    position: 'absolute',
    width: '0.5rem',
    height: '0.5rem',
    backgroundColor: 'white',
    transform: 'rotate(45deg)',
    zIndex: -1,
  }
};

const Tooltip = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef(null);
  const tooltipRef = useRef(null);

  const handleMouseEnter = () => {
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 1000);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeoutRef.current);
    setIsVisible(false);
  };

  const handleMouseMove = (e) => {
    setPosition({
      x: e.clientX,
      y: e.clientY
    });

    if (tooltipRef.current && isVisible) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let adjustedX = e.clientX;
      let adjustedY = e.clientY + 20; 

      if (adjustedX + tooltipRect.width > windowWidth) {
        adjustedX = windowWidth - tooltipRect.width - 10;
      }

      if (adjustedY + tooltipRect.height > windowHeight) {
        adjustedY = e.clientY - tooltipRect.height - 10;
      }

      setPosition({
        x: adjustedX,
        y: adjustedY
      });
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{ display: 'flex', flex:1 }}
    >
      {children}
      {isVisible && (
        <div 
          ref={tooltipRef}
          style={{
            ...tooltipStyles.tooltip,
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
        >
          {text}
          <div 
            style={{
              ...tooltipStyles.arrow,
              top: '-4px',
              left: '10px',
            }} 
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;