import en from '../../messages/en.json';

type Messages = typeof en;

declare global {
  // Use interface for declaration merging
  interface IntlMessages extends Messages {
    _dummy: never;
  }
}
