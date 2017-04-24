/// <reference path="../../typings/globals/react/index.d.ts" />
/// <reference path="../../typings/globals/react-dom/index.d.ts" />
/// <reference path="../../built/pxtlib.d.ts" />
/// <reference path="../../localtypings/blockly.d.ts" />

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as workspace from "./workspace";
import * as data from "./data";
import * as sui from "./sui";
import * as simulator from "./simulator";
import * as blocks from "./blocks";

interface ReconstructionProps extends pxt.editor.ISettingsProps { blockEditor: blocks.Editor };
type IReconstructionProps = ReconstructionProps;

export class ReconstructionTools extends data.Component<IReconstructionProps, {loadedFile:any[], currentDataIndex: number}> {

    constructor(props: IReconstructionProps) {
        super(props);

        this.state = {
            loadedFile: [],
            currentDataIndex:0
        }
    }

    fileSelected(evt:any)
    {

        var parent = this;

        console.log(this);
        let files: File[] =  evt.target.files;

        for(let index in files)
        {
            let file = files[index]
            let reader = new FileReader();

            reader.onload = function(){

                var loadedFile: any[];

                loadedFile = JSON.parse(this.result).reverse();

                parent.setState({
                    loadedFile: loadedFile,
                    currentDataIndex: 0
                })

                parent.loadState({target:{value:"0"}});
            };

            // Read in the file as a data URL.
            reader.readAsText(file);
        }

        console.log("file selected")

    }

    loadState(evt: any){

        var index = Number(evt.target.value)

        console.log("slider: ",index);

        var programData = this.state.loadedFile[index];

        console.log("current program ", programData);

        this.props.blockEditor.loadBlockly(programData.data);

        this.setState({
            loadedFile: this.state.loadedFile,
            currentDataIndex: index
        })
    }

    render() {

        let samples: any[] = [];

        console.log(this.state)
        console.log(this.state.loadedFile)

        return (
            <div className="ui equal width grid right aligned padded">
                <div className="column">
                    {
                        (this.state.loadedFile && this.state.loadedFile.length > 0) ? <p>Editor version: {this.state.loadedFile[0].editor_version}</p> : null
                    }
                </div>
                <div className="column">
                    {
                        (this.state.loadedFile && this.state.loadedFile.length > 0) ? <p>{new Date(this.state.loadedFile[this.state.currentDataIndex].timestamp).toString()}</p> : null
                    }
                </div>
                <div className="column">
                    {
                        (this.state.loadedFile && this.state.loadedFile.length > 0) ?
                            <input type="range" onChange={this.loadState.bind(this)} min={0} value={String(this.state.currentDataIndex)} max ={this.state.loadedFile.length}/> : null
                    }
                </div>
                <div className="column">
                    <input type="file" name="fileToUpload" id="fileToUpload" onChange={this.fileSelected.bind(this)}/>
                </div>
            </div>)
    }
}
