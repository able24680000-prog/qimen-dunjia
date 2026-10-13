/*
 * @Description: 天干地支对象
 * @Version: 1.0.0
 * @Author: lax
 * @Date: 2020-10-22 20:15:13
 * @LastEditors: lax
 * @LastEditTime: 2024-07-13 23:24:46
 */
const CelestialStems = require("./CelestialStems");
const TerrestrialBranches = require("./TerrestrialBranches");
const {
  SEXAGENARY_CYCLE_ARR,
  SEXAGENARY_CYCLE,
  SC,
  SC_ARR
} = require("tao_name");
const inspect = Symbol.for("nodejs.util.inspect.custom");
/**
 * 天干地支对象
 */
class SexagenaryCycle {
  constructor(...num) {
    /**
     * 天干序号 0~9
     * @type {CelestialStems}
     */
    this.x;
    /**
     * 地支序号 0~11
     * @type {TerrestrialBranches}
     */
    this.y;
    /**
     * 干支序号 0~59
     * @type {number}
     */
    this.index;
    if (num.length === 1) this.#generateByOne(num[0]);
    if (num.length >= 2) this.#generateByTwo(num[0], num[1]);
  }

  /**
   * 天干序列 Celestial Stems->0-9
   * @param {boolean} is
   * @returns 名称/序号
   */
  cs(is = false) {
    return is ? this.x.getValue(true) : this.x;
  }

  /**
   * 地支序列 Terrestrial Branches->0-11
   * @param {boolean} is
   * @returns 名称/序号
   */
  tb(is = false) {
    return is ? this.y.getValue(true) : this.y;
  }

  /**
   * 天干地支序列 0-59
   * @param {boolean} is
   * @returns 名称/序号
   */
  cstb(is = false) {
    return is ? this.cs(is) + this.tb(is) : this.index;
  }

  /**
   * 获得旬首
   * @returns {SexagenaryCycle} sexagenaryCycle
   */
  getLead() {
    const index = ~~(this.index / 10) * 10;
    return new SexagenaryCycle(index);
  }

  /**
   * 获取对应的干支序号
   * @param {*} x 天干
   * @param {*} y 地支
   * @returns {Number} 干支序号
   */
  #getIndex(x = this.x, y = this.y) {
    if (x === -1 || y === -1 || x % 2 === 0 !== (y % 2 === 0)) throw new Error(`can\`t use this arg by x:${x} y:${y}`);

    // 干支相差之数（负按12转正）/2 = 6-干支十位数值
    const difference = y.getValue() - x.getValue();
    const index = (difference + 12) % 12 / 2;
    const tensPlace = (6 - index) % 6;
    return tensPlace * 10 + x.getValue();
  }

  /**
   * 根据一个序列获取干支
   * @param {*} arg 参数
   */
  #getByIndex(_arg) {
    // 参数为数 取值范围0-59
    const arg = Math.abs(_arg % 60);
    // result-> 0-9 -> celestialStems.index
    const x = arg % 10;
    // result-> 0-11 -> terrestrialBranches.index
    const y = arg % 12;
    // result-> 0-59
    this.#generateByCSAndTB(x, y);
    this.index = arg;
  }
  #generateByOne(_arg) {
    let arg = _arg;
    if (arg instanceof SexagenaryCycle) return arg;
    if (typeof arg === "string") {
      if (~~(arg + 1)) {
        // 转数字处理
        arg = ~~arg;
      } else if (arg.length === 2) {
        // 转数组处理
        arg = Array.from(arg);
      } else {
        throw new Error(`array length must be equals two`);
      }
    }
    if (typeof arg === "number") {
      this.#getByIndex(arg);
      return;
    }
    if (arg instanceof Array) {
      this.#generateByTwo(arg[0], arg[1]);
      return;
    }
    if (typeof arg === "object") {
      // 将key,value的对象转为基本对象
      const {
        x,
        y
      } = Object.fromEntries(Object.entries(arg));
      this.#generateByTwo(x, y);
      return;
    }
    throw new Error("this arg can't to use");
  }
  #generateByTwo(x, y) {
    this.#generateByCSAndTB(x, y);
    this.index = this.#getIndex();
  }

  /** 根据天干地支对象生成 */
  #generateByCSAndTB(x, y) {
    this.x = new CelestialStems(x);
    this.y = new TerrestrialBranches(y);
  }
  [inspect]() {
    return this.cstb();
  }
}
SexagenaryCycle.SEXAGENARY_CYCLE_ARR = SEXAGENARY_CYCLE_ARR;
SexagenaryCycle.SEXAGENARY_CYCLE = SEXAGENARY_CYCLE;
SexagenaryCycle.SC = SC;
SexagenaryCycle.SC_ARR = SC_ARR;
module.exports = SexagenaryCycle;

