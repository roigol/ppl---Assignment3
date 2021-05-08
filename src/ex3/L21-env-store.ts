import { add, map, zipWith, append, indexOf } from "ramda";
import { Value } from './L21-value-store';
import { Result, makeFailure, makeOk, bind, either } from "../shared/result";

// ========================================================
// Box datatype
// Encapsulate mutation in a single type.
type Box<T> = T[];
const makeBox = <T>(x: T): Box<T> => ([x]);
const unbox = <T>(b: Box<T>): T => b[0];
const setBox = <T>(b: Box<T>, v: T): void => { b[0] = v; return; }

// ========================================================
// Store datatype
export interface Store {
    tag: "Store";
    vals: Box<Box<Value>[]>;
}
//.............................wrap eith another box
export const isStore = (x: any): x is Store => x.tag === "Store";

export const makeEmptyStore = (): Store => ({tag: "Store", vals: makeBox([])});

export const theStore: Store = makeEmptyStore();

export const extendStore = (s: Store, val: Value): Store =>{ // happens at "define", "lambda"
    setBox(s.vals, append(makeBox(val), unbox(s.vals)));
    return s;
}

export const extendStore2 = (val: Value): number =>{//..................added
    const currSize: number = unbox(theStore.vals).length
    setBox(theStore.vals, append(makeBox(val), unbox(theStore.vals)));
    return currSize;
}

export const applyStore = (store: Store, address: number): Result<Value> => {
    const valueBox: Box<Value>[] = unbox(store.vals)
    return valueBox.length > address ?  makeOk(unbox(valueBox[address])) : makeFailure("No such address");
}

export const setStore = (store: Store, address: number, val: Value): void => //happens at "set!"
    setBox(unbox(store.vals)[address], val); 

export const setStore2 = (store: Store, address: number, val: Value): Result<void> =>
    makeOk(setBox(unbox(store.vals)[address], val));


// ========================================================
// Environment data type
// export type Env = EmptyEnv | ExtEnv;
export type Env = GlobalEnv | ExtEnv;

interface GlobalEnv {
    tag: "GlobalEnv";
    vars: Box<string[]>;
    addresses: Box<number[]>
}

export interface ExtEnv {
    tag: "ExtEnv";
    vars: string[];
    addresses: number[];
    nextEnv: Env;
}

const makeGlobalEnv = (): GlobalEnv =>
    ({tag: "GlobalEnv", vars: makeBox([]), addresses:makeBox([])});

export const isGlobalEnv = (x: any): x is GlobalEnv => x.tag === "GlobalEnv";

// There is a single mutable value in the type Global-env
export const theGlobalEnv = makeGlobalEnv();

export const makeExtEnv = (vs: string[], addresses: number[], env: Env): ExtEnv =>
    ({tag: "ExtEnv", vars: vs, addresses: addresses, nextEnv: env});

const isExtEnv = (x: any): x is ExtEnv => x.tag === "ExtEnv";

export const isEnv = (x: any): x is Env => isGlobalEnv(x) || isExtEnv(x);

// Apply-env
export const applyEnv = (env: Env, v: string): Result<number> =>
    isGlobalEnv(env) ? applyGlobalEnv(env, v) :
    applyExtEnv(env, v);

const applyGlobalEnv = (env: GlobalEnv, v: string): Result<number> => {
    const index: number = indexOf(v, unbox(env.vars))
    const address: number = index > -1 ? unbox(env.addresses)[index] : -1
    return address > -1 ? makeOk(address) : makeFailure("No such value");
}

export const globalEnvAddBinding = (v: string, addr: number): void =>{
    const globEnv: GlobalEnv = theGlobalEnv
    setBox(globEnv.vars, append(v, unbox(globEnv.vars)))
    setBox(globEnv.addresses, append(addr, unbox(globEnv.addresses)))
}


const applyExtEnv = (env: ExtEnv, v: string): Result<number> =>
    env.vars.includes(v) ? makeOk(env.addresses[env.vars.indexOf(v)]) :
    applyEnv(env.nextEnv, v);
