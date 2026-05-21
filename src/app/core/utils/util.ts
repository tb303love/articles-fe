export class ObjectUtils {
  static isEmptyObject<T extends object>(obj: T) {
    return Object.keys(obj).length === 0;
  }
}
