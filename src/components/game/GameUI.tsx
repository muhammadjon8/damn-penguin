import { useGameStore } from '@/store/gameStore';
import { useEffect, useState } from 'react';

// Milestone notification component
const MilestoneNotification = () => {
  const { showMilestone, milestoneText } = useGameStore();
  
  if (!showMilestone) return null;
  
  return (
    <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
      <div className="animate-scale-in">
        <p className="melancholic-text text-4xl md:text-6xl title-gradient text-center">
          {milestoneText}
        </p>
        <p className="text-accent/60 text-center text-sm mt-2 tracking-widest uppercase">
          Keep going...
        </p>
      </div>
    </div>
  );
};

// Combo counter component
const ComboCounter = () => {
  const { comboCount, comboTimer } = useGameStore();
  const [visible, setVisible] = useState(false);
  const [lastCombo, setLastCombo] = useState(0);
  
  useEffect(() => {
    if (comboCount > 0) {
      setVisible(true);
      setLastCombo(comboCount);
    } else {
      // Fade out
      const timer = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [comboCount]);
  
  if (!visible) return null;
  
  const comboPercentage = (comboTimer / 2) * 100;
  const comboColor = lastCombo >= 10 ? 'text-fish' : lastCombo >= 5 ? 'text-accent' : 'text-foreground';
  
  return (
    <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
      <div className={`glass-panel rounded-lg px-4 py-2 text-center transition-all duration-300 ${comboCount > 0 ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
        <p className="text-accent/60 text-xs uppercase tracking-wider">Combo</p>
        <p className={`font-display text-3xl ${comboColor}`}>
          x{lastCombo}
        </p>
        {/* Combo timer bar */}
        <div className="w-full h-1 bg-secondary/30 rounded-full mt-1 overflow-hidden">
          <div 
            className="h-full bg-accent transition-all duration-100"
            style={{ width: `${comboPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Ability cooldown indicators
const AbilityIndicators = () => {
  const { bellySlideEnergy, bellySlideCooldown, speedBoostTimer } = useGameStore();
  
  const energyPercent = (bellySlideEnergy / 3) * 100;
  const cooldownActive = bellySlideCooldown > 0;
  const boostActive = speedBoostTimer > 0;
  
  return (
    <div className="absolute bottom-4 left-4 z-10 pointer-events-none flex flex-col gap-2">
      {/* Belly slide energy */}
      <div className="glass-panel rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🐧</span>
          <div className="w-16 h-2 bg-secondary/30 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-200 ${cooldownActive ? 'bg-destructive/50' : 'bg-primary'}`}
              style={{ width: `${cooldownActive ? 0 : energyPercent}%` }}
            />
          </div>
        </div>
        {cooldownActive && (
          <p className="text-xs text-muted-foreground text-center mt-1">
            {Math.ceil(bellySlideCooldown)}s
          </p>
        )}
      </div>
      
      {/* Speed boost indicator */}
      {boostActive && (
        <div className="glass-panel rounded-lg px-3 py-2 animate-pulse-soft">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <p className="text-xs text-accent uppercase tracking-wider">Speed Boost!</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Weather indicator
const WeatherIndicator = () => {
  const { weather, timeOfDay } = useGameStore();
  
  const weatherIcons: Record<string, string> = {
    clear: '☀️',
    light_snow: '🌨️',
    blizzard: '❄️',
    foggy: '🌫️',
  };
  
  const timeIcons: Record<string, string> = {
    dawn: '🌅',
    day: '☀️',
    dusk: '🌇',
    night: '🌙',
  };
  
  return (
    <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
      <div className="glass-panel rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="text-lg">{timeIcons[timeOfDay]}</span>
        <span className="text-lg">{weatherIcons[weather]}</span>
      </div>
    </div>
  );
};

// Control hints (show briefly at start)
const ControlHints = () => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);
  
  if (!visible) return null;
  
  return (
    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
      <div className="glass-panel rounded-lg px-4 py-2 text-center animate-fade-in-slow">
        <p className="text-muted-foreground/70 text-xs">
          ← → lanes • ↑ jump • Hold ↓ belly slide
        </p>
      </div>
    </div>
  );
};

export const GameUI = () => {
  const { score, distance, weather } = useGameStore();
  
  // Visibility modifier based on weather
  const blizzardClass = weather === 'blizzard' ? 'opacity-80' : '';

  return (
    <>
      <div className={`absolute top-0 left-0 right-0 z-10 pointer-events-none p-4 md:p-6 ${blizzardClass}`}>
        <div className="flex justify-between items-start">
          {/* Distance counter */}
          <div className="glass-panel rounded-lg px-4 py-2">
            <p className="text-accent/60 text-xs uppercase tracking-wider mb-1">Distance</p>
            <p className="font-display text-2xl md:text-3xl text-foreground">
              {Math.floor(distance)}m
            </p>
          </div>
          
          {/* Score counter */}
          <div className="glass-panel rounded-lg px-4 py-2 text-right">
            <p className="text-accent/60 text-xs uppercase tracking-wider mb-1">Fish</p>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-fish text-lg">🐟</span>
              <p className="font-display text-2xl md:text-3xl text-foreground">
                {Math.floor(score)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <MilestoneNotification />
      <ComboCounter />
      <AbilityIndicators />
      <WeatherIndicator />
      <ControlHints />
    </>
  );
};
