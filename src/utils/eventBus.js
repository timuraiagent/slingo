import Phaser from 'phaser';

export const bus = new Phaser.Events.EventEmitter();

if (typeof window !== 'undefined') {
  window.getBusListenerCount = () => {
    const names = bus.eventNames();
    return names.reduce((sum, name) => sum + bus.listenerCount(name), 0);
  };
}
