import {isFunction} from "@vue/shared";
import {activeEffect, ReactiveEffect, trackEffects, triggerEffects} from "./effect";

class ComputedRefImpl {
  public effect;
  public _dirty = true; //默认应该取值的时候进行计算
  public __v_isReadonly: true;
  public __v_isRef: true;
  public _value;
  public dep = new Set

  constructor(getter, public setter) {
    // 将用户的getter放到effect中，这里依赖就会被effect收集起来
    this.effect = new ReactiveEffect(getter, () => {
      if(!this._dirty){
        this._dirty = true
        // 实现一个触发更新
        triggerEffects(this.dep)
      }
    })
  }

  get value() {
    // 做依赖收集
    if(activeEffect){
      trackEffects(this.dep)
    }
    if (this._dirty) {
      this._dirty = false
      this._value = this.effect.run()
    }
    return this._value
  }

  set value(newVal) {
    this.setter(newVal)
  }
}

export const computed = (getterOrOptions) => {
  let onlyGetter = isFunction(getterOrOptions)
  let getter;
  let setter;

  if (onlyGetter) {
    getter = getterOrOptions
    setter = () => {
      console.warn("no set")
    }
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(getter, setter)
}
