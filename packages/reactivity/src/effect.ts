export let activeEffect = undefined;

function cleanEffect(effect) {
  const {deps} = effect;
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect)
  }
  effect.deps.length = 0;
}

export class ReactiveEffect {
  public parent = undefined;
  public deps = []
  active = true; // 是否是激活状态
  constructor(public fn, public scheduler) {
  }

  run() {
    if (!this.active) {
      // 如果是非激活的情况，只需要执行函数，不需要进行依赖收集
      return this.fn()
    }
    // 依赖收集 核心是将当前的 effect 和稍后渲染的属性关联在一起

    try {
      this.parent = activeEffect
      activeEffect = this;
      // 当稍后调用取值操作的时候 就可以获取到这个全局的activeEffect 了

      cleanEffect(this)
      return this.fn()
    } finally {
      activeEffect = this.parent;
      this.parent = undefined;
    }
  }

  stop() {
    if (this.active) {
      this.active = false;
      cleanEffect(this)
    }
  }
}

export function effect(fn, options={}) {
  // 这里fn就医根据状态变化，重新执行，effect可以嵌套写
  // @ts-ignore
  const _effect = new ReactiveEffect(fn, options?.scheduler)
  _effect.run()
  const runner = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

const targetMap = new WeakMap()

export function track(target, type, key) {
  // 对象 某个属性 -> 多个Effect
// weakMap: {对象：Map:{name:Set[]}}
  if (!activeEffect) return;
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, depsMap = new Map())
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }
  trackEffects(dep)
}

export function trackEffects(dep){
  let shouldTrack = !dep.has(activeEffect)
  if (shouldTrack) {
    dep.add(activeEffect)
    // effect 记录对应的dep，effect重新执行时可以清理对应的依赖
    activeEffect.deps.push(dep)
  }
}


export function trigger(target, type, key, value, oldValue) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return;

  let effects = depsMap.get(key)
  // 永远在执行之前先拷贝一份来执行，不要关联引用
  if (effects) {
    triggerEffects(effects)
  }
}

export function triggerEffects(effects){
  effects = new Set(effects)
  effects.forEach(effect => {
    // 我们在执行effect的时候，又要执行自己，那我们需要屏蔽，不要无限调用
    if (effect !== activeEffect) {
      if (effect.scheduler) {
        effect.scheduler()
      } else {
        effect.run()
      }
    }
  })
}
