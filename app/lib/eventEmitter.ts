import { EventEmitter } from 'events';

// Create a single instance to be used throughout the application
const bidEventEmitter = new EventEmitter();

// Increase the listener limit if needed, default is 10
// bidEventEmitter.setMaxListeners(20); 

export default bidEventEmitter; 