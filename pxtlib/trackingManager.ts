/// <reference path="../pxteditor/localStorage.ts" />
/// <reference path ="../typings/globals/jquery/index.d.ts"/>

namespace pxt.analytics {

    let EDITOR_VERSION = "A";

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
        ids:string[];

        serverUrl: string;

        interval: number;

        constructor(communicatorTimer:number, url?: string)
        {
            this.ids = [];
            this.serverUrl = url || "http://scc-devine.lancs.ac.uk:8000/api/event";
            this.interval = setInterval(this.communicator,communicatorTimer)
            window.trackingManager = this;
        }

        eatCookie(name:string): any
        {
            function escape(s:string) { return s.replace(/([.*+?\^${}()|\[\]\/\\])/g, '\\$1'); };
            var match = document.cookie.match(RegExp('(?:^|;\\s*)' + escape(name) + '=([^;]*)'));
            return match ? match[1] : null;
        }

        communicator()
        {
            let parent = window.trackingManager;
            console.log("COMMUNICATOR ");
            console.log(parent.ids, this);

            for(let i = 0; i < parent.ids.length; i++)
            {
                let data:any = parent.get(parent.ids[i]);
                console.log(parent.ids[i], data);

                if(data == null)
                    continue;

                jQuery.ajax({
                    type:"POST",
                    url: parent.serverUrl,
                    data: JSON.stringify({
                        editor_version: pxt.analytics.EDITOR_VERSION,
                        data:data,
                        namespace:parent.ids[i]
                    }),
                    contentType: "application/json; charset=utf-8",
                    dataType:"json"
                }).done(function(data){
                    if(!window.pxt_cookie)
                    {
                        window.pxt_cookie = parent.eatCookie("pxt_tracking");
                        if(window.pxt_cookie != null)
                        {
                            console.log("COOKIE RETRIEVED ",window.pxt_cookie);
                            // force ourselves onto the dom...
                            jQuery("#logo").append('<p style="font-size:10px; position:absolute; bottom:0;">Editor Verison: ' + pxt.analytics.EDITOR_VERSION + ' ID: ' + window.pxt_cookie +'</p>')
                        }
                    }
                    console.log(data);
                })

                parent.clear(parent.ids[i]);
            }
        }

        trackEvent(id : string, event:TrackedEvent)
        {
            console.log("IDS: ",this.ids);
            console.log("STORING: ",id, event);

            if(this.ids.indexOf(id) == -1)
                this.ids.push(id);

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
interface Window { trackingManager: pxt.analytics.Tracker; pxt_cookie: string};
