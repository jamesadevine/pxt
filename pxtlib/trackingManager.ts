/// <reference path="../pxteditor/localStorage.ts" />

namespace pxt.analytics {

    export class TrackedEvent
    {
        type: string;
        timestamp: number;
        data: any;

        constructor(type:string, data?:any)
        {
            this.type = type;
            this.data = (data) ? data : null;
            this.timestamp = new Date().valueOf();
        }
    }

    export class TrackedMouseEvent extends TrackedEvent
    {
        x: number;
        y: number;
        srcId: string;
        srcClass: string;
        srcNodeName: string;

        constructor(evt:MouseEvent, type:string)
        {
            super(type)
            this.x = evt.clientX;
            this.y = evt.clientY;
            this.srcId = evt.srcElement.id;
            this.srcNodeName = evt.srcElement.nodeName;
            this.srcClass = evt.srcElement.className;
        }
    }

    export class BlocklyEvent extends TrackedEvent
    {
        workspaceId: string;
        workspace: Blockly.Workspace;
        blockId: string;
        group: string;
        blockType: string;


        constructor(ev: any, workspace: Blockly.Workspace)
        {
            super(ev.type || "");
            this.workspace = workspace;
            this.type = ev.type || "";

            this.workspaceId = ev.workspaceId || "";
            this.blockId = ev.blockId || "";
            this.group = ev.group || "";

            this.blockType = this.getBlockType(this.blockId);
        }

        getBlockType(id: string) : string
        {
            let block = this.workspace.getBlockById(id);
            return (block) ? block.type : "";
        }

        log() : any
        {
            let obj = {
                type: this.type,
                workspaceId: this.workspaceId,
                blockId: this.blockId,
                group: this.group,
                blockType: this.blockType,
                timestamp: this.timestamp
            }

            return obj;
        }
    }

    export class BlocklyUIEvent extends BlocklyEvent
    {
        uiType: string;

        oldValue: any;
        newValue: any;

        constructor(ev: any, workspace: Blockly.Workspace)
        {
            super(ev, workspace);

            this.uiType = ev.element;
            this.oldValue = ev.oldValue;
            this.newValue = ev.newValue;
        }

        log() : any
        {
            let parent = super.log();

            switch(this.uiType)
            {
                // block selected
                case "selected":
                    parent.blockId = this.newValue;
                    parent.blockType = this.getBlockType(this.blockId);
                    break;

                //menu selected
                case "category":
                case "click":
                case "commentOpen":
                case "mutatorOpen":
                case "warningOpen":
                    break;
            }
            parent.uiType = this.uiType;
            parent.oldValue = this.oldValue;
            parent.newValue = this.newValue;

            return parent;
        }
    }

    export class BlocklyCreateEvent extends BlocklyEvent
    {
        xml: Object;
        ids: Array<string>;
        constructor(ev: any, workspace: Blockly.Workspace)
        {
            super(ev, workspace);

            this.xml = ev.xml;
            this.ids = ev.ids;
        }

        log(): any
        {
            console.log("SUPER ", super.log());
            let parent = super.log();
            parent.xml = this.xml;
            parent.ids = this.ids;

            return parent;
        }
    }

    export class BlocklyDeleteEvent extends BlocklyEvent
    {
        xml: Object;
        ids: Array<string>;

        constructor(ev: any, workspace: Blockly.Workspace)
        {
            super(ev, workspace);

            this.xml = ev.oldXml;
            this.ids = ev.ids
        }

        log(): any
        {
            let parent = super.log();
            parent.xml = this.xml;
            parent.ids = this.ids;

            return parent;
        }
    }

    export class BlocklyChangeEvent extends BlocklyUIEvent
    {
        name:string;

        constructor(ev: any, workspace: Blockly.Workspace)
        {
            super(ev, workspace);
            this.name = ev.name;
        }

        log(): any
        {
            let parent = super.log();
            parent.name = this.name;

            return parent;
        }
    }

    export class BlocklyMoveEvent extends BlocklyEvent
    {
        oldParentId: string;
        newParentId: string;

        oldParentBlockType: string;
        newParentBlockType: string;

        oldCoordinate: Object;
        newCoordinate: Object;

        oldInputName: string
        newInputName: string;

        constructor(ev: any, workspace: Blockly.Workspace)
        {
            super(ev, workspace);

            this.oldParentId = ev.oldParentId || "";
            this.newParentId = ev.newParentId || "";

            this.oldParentBlockType = this.getBlockType(ev.oldParentId);
            this.newParentBlockType = this.getBlockType(ev.newParentId);

            this.oldCoordinate = ev.oldCoordinate;
            this.newCoordinate = ev.newCoordinate;

            this.oldInputName = ev.oldInputName || "";
            this.newInputName = ev.newInputName || "";
        }

        log() : any
        {
            let parent = super.log();
            parent.oldParentId = this.oldParentId;
            parent.newParentId = this.newParentId;
            parent.oldParentBlockType = this.oldParentBlockType;
            parent.newParentBlockType = this.newParentBlockType;
            parent.oldCoordinate = this.oldCoordinate
            parent.newCoordinate = this.newCoordinate;
            parent.oldInputName = this.oldInputName;
            parent.newInputName = this.newInputName;

            return parent;
        }
    }

    export class Tracker
    {
        address: string;

        constructor()
        {
            window.trackingManager = this;
        }

        /*
            @param id keystore identifier used for storing records.
        */
        trackEvent(id : string, event:TrackedEvent)
        {
            console.log("STORING: ",id, event);
            this.store(id, event);
        }

        trackException(err: Error, id: string, props: Map<string>)
        {

        }

        private store(key:string, obj: any)
        {
            let stored = this.get(key);

            console.log("got: ",stored);
            if(!stored)
            {
                pxt.storage.setLocal(key, JSON.stringify([obj]));
                return;
            }

            stored.push(obj)
            pxt.storage.setLocal(key, JSON.stringify(stored));
        }

        get(key: string): any
        {
            let stored = pxt.storage.getLocal(key);
            console.log("retrieved ", key + " ", stored);
            return (stored) ? JSON.parse(stored) : null;
        }


        clear(key:string)
        {
            pxt.storage.removeLocal(key);
        }

        clearN(key: string, n: number)
        {
            let stored = this.get(key);

            if(stored == null)
                return;

            this.clear(key);

            if(n >= stored.length)
                return;

            stored = stored.splice(0, n);

            this.store(key, stored);
        }
    }
}
interface Window { trackingManager: pxt.analytics.Tracker; };