import {isArray, isObject} from "@vue/shared";
import {reactive} from "./reactive";
import {activeEffect, trackEffects, triggerEffects} from "./effect";

function toReactive(value){
  return isObject(value) ? reactive(value) : value
}

class RefImpl{
  public _value;
  public __v_isRef: true;
  public dep = new Set
  constructor(public rawValue) {
    this._value = toReactive(rawValue)
  }

  get value(){
    if(activeEffect){
      trackEffects(this.dep)
    }
    return this._value
  }

  set value(newValue){
    if(newValue !== this.rawValue){
      this._value = toReactive(newValue)
      this.rawValue = newValue
      triggerEffects(this.dep)
    }
  }
}

export function ref(value){
  return new RefImpl(value)
}

function toRef(object,key){
  return new ObjectRefImpl(object,key)
}

class ObjectRefImpl{
  constructor(public object,public key) {}
  get value(){
    return this.object[this.key]
  }
  set value(newValue){
    this.object[this.key] = newValue
  }
}

export function toRefs(object){
  const result = isArray(object) ? new Array(object.length) : {}

  for (const key in result) {
    result[key] = toRef(object,key)
  }

  return result
}
