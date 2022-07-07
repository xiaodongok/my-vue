import {ReactiveEffect} from "./effect";
import {isReactive} from "./reactive";
import {isFunction, isObject} from "@vue/shared";

// 考虑循环引用的问题
function traversal(value,set = new Set()){
  if(!isObject(value)) return value;

  if(set.has(value)){
    return value
  }

  set.add(value)
  for (const key in value) {
    traversal(value[key],set)
  }

  return value
}

// source 是用户传入的对象 , cb 就是对应的用户的回调
export function watch(source, cb) {
  let getter; // 收集依赖时执行
  if (isReactive(source)) {
    // 传入的数据进行递归循环，循环就会访问到对象上的一个属性，访问属性就会收集effect
    getter = () => traversal(source)
  }else if(isFunction(source)){
    getter = source
  }

  let cleanup
  const onCleanup = (fn) => {
    cleanup = fn
  }

  let oldValue

  const job = () => {
    if(cleanup) cleanup() // 下一次watch开始时
    // 依赖更新时执行
    const newValue = effect.run()
    console.log("newValue",newValue)
    cb(newValue,oldValue,onCleanup)
    oldValue = newValue
  }

  const effect = new ReactiveEffect(getter, job)
  oldValue = effect.run();
  console.log("oldValue",oldValue)
}
