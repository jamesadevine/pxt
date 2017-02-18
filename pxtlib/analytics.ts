///<reference path='../localtypings/blockly.d.ts'/>

namespace pxt.analytics {

    let WINDOW_NAMESPACE:string = "window"
    let BLOCKLY_NAMESPACE:string = "blockly"
    let PROGRAM_NAMESPACE:string = "program"
    let SIMULATOR_NAMESPACE:string = "simulator"

    let namespaceArray = [WINDOW_NAMESPACE, BLOCKLY_NAMESPACE, PROGRAM_NAMESPACE, SIMULATOR_NAMESPACE];

    let enabled = false;

    export function trackBlocklyEvent(ev: any, workspace:Blockly.Workspace)
    {
        if(!enabled)
            enable();

        let blocklyDom = Blockly.Xml.workspaceToDom(workspace)

        let event: BlocklyEvent;

        switch(ev.type)
        {
            case Blockly.Events.CHANGE:
                event = new BlocklyChangeEvent(ev, workspace);
                break;
            case Blockly.Events.MOVE:
                event = new BlocklyMoveEvent(ev, workspace);
                window.trackingManager.trackEvent(PROGRAM_NAMESPACE, new TrackedEvent("program", Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace))));
                break;
            case Blockly.Events.DELETE:
                event = new BlocklyDeleteEvent(ev, workspace);
                window.trackingManager.trackEvent(PROGRAM_NAMESPACE, new TrackedEvent("program", Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace))));
                break;
            case Blockly.Events.CREATE:
                event = new BlocklyCreateEvent(ev, workspace);
                window.trackingManager.trackEvent(PROGRAM_NAMESPACE, new TrackedEvent("program", Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace))));
                break;
            case Blockly.Events.UI:
                event = new BlocklyUIEvent(ev, workspace);
                break;
        }

        console.log("Blockly Event: ", event.log());
        window.trackingManager.trackEvent(BLOCKLY_NAMESPACE, event.log());
    }

    export function enable() {
        console.log("analytics enabled");

        let ai = new pxt.analytics.Tracker(1000);


        enabled = true;

        pxt.debug('enabling app insights')

        const te = pxt.tickEvent;
        pxt.tickEvent = function (id: string, data?: Map<string | number>): void {
        }

        window.addEventListener("message", (event:any)=>{
            console.log("RECIEVED", event);

            if(event.type !== undefined && event.type === "analytics")
            {
                window.trackingManager.trackEvent(SIMULATOR_NAMESPACE, new pxt.analytics.TrackedEvent(event.type, event.data));
            }
        }, false);

        window.onclick = function (ev : MouseEvent)
        {
            window.trackingManager.trackEvent(WINDOW_NAMESPACE, new pxt.analytics.TrackedMouseEvent(ev, "click"));
        }

        window.onresize = function(ev: any)
        {
            window.trackingManager.trackEvent(WINDOW_NAMESPACE, new pxt.analytics.TrackedEvent("resize", {width: ev.srcElement.width, height: ev.srcElement.height}));
        }

        let mouseTracker = new Date();

        window.onmousemove = function(ev: MouseEvent)
        {
            let now = new Date();

            if(now.valueOf() - mouseTracker.valueOf() > 10)
            {
                console.log("mousemove ", ev);
                window.trackingManager.trackEvent(WINDOW_NAMESPACE, new pxt.analytics.TrackedMouseEvent(ev, "mousemove"));
                mouseTracker = now;
            }
        }

        const dbg = pxt.debug;
        pxt.debug = function (msg: any): void {
            if (dbg) dbg(msg);
        }

        const rexp = pxt.reportException;
        pxt.reportException = function (err: any, data: pxt.Map<string>): void {
            if (rexp) rexp(err, data);
            const props: pxt.Map<string> = {
                target: pxt.appTarget.id,
                version: pxt.appTarget.versions.target
            }
            if (data) Util.jsonMergeFrom(props, data);
            ai.trackException(err, 'exception', props)
        }
        const re = pxt.reportError;
        pxt.reportError = function (cat: string, msg: string, data?: pxt.Map<string>): void {
            if (re) re(cat, msg, data);
            try {
                throw msg
            }
            catch (err) {
                const props: pxt.Map<string> = {
                    target: pxt.appTarget.id,
                    version: pxt.appTarget.versions.target,
                    category: cat,
                    message: msg
                }
                if (data) Util.jsonMergeFrom(props, data);
                ai.trackException(err, 'error', props)
            }
        }
    }
}
