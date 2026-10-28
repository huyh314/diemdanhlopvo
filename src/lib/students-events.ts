export const STUDENTS_CHANGED_EVENT = 'students:changed';

/** Refresh the live list after a successful mutation in this app window. */
export function notifyStudentsChanged() {
    window.dispatchEvent(new Event(STUDENTS_CHANGED_EVENT));
}
