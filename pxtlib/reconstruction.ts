///<reference path='../localtypings/blockly.d.ts'/>

namespace pxt.reconstruction {
    let enabled :boolean = false;
    export function enable() {
        enabled = true;
        console.log("reconstruction enabled")
    }

    export function isEnabled():boolean{
        return enabled;
    }
}
