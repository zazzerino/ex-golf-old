/**
 * https://en.wikipedia.org/wiki/Publish-subscribe_pattern
 * 
 * Adapted from an example by Christopher T. 
 * https://jsmanifest.com/the-publish-subscribe-pattern-in-javascript/
 */
export function makePubSub() {
  const subscribers = {};

  const publish = (event, data) => {
    if (subscribers[event]) {
      subscribers[event].forEach(callback => callback(data));
    }
  }

  const subscribe = (event, callback) => {
    if (!subscribers[event]) {
      subscribers[event] = [];
    }

    subscribers[event].push(callback);
  }

  return {
    publish,
    subscribe,
  }
}

/**
 * Rotates `array` around `index`.
 * 
 * rotateArray([1, 2, 3, 4], 3) -> [4, 1, 2, 3]
 */
export function rotateArray(array, index) {
  const length = array.length;
  index = index % length;

  const front = array.slice(0, index);
  const back = array.slice(index, length);

  return back.concat(front);
}
