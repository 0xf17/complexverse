import React from 'react';
import { useMemo, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import './main.scss';
import icon_Index from './img/index.svg';
import icon_Close from './img/close.svg';
import GraphList from './graphlist.json';
import ForceGraph3D from 'react-force-graph-3d';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Vector3, LineBasicMaterial, FogExp2 } from 'three';

const extraRenderers = [new CSS2DRenderer()];
const mat1 = new LineBasicMaterial({ color: "#dcdcdd" });
const mat2 = new LineBasicMaterial({ color: "#1985A1" });

const node_active = (node) => {
    const nodeEl = document.createElement('div');
    nodeEl.textContent = node.name;
    nodeEl.style.fontSize = "1rem";
    nodeEl.style.color = "#ffffff";
    nodeEl.style.background = "#1985A1";
    nodeEl.className = 'node-label';
    return new CSS2DObject(nodeEl);
}

const node_default = (node) => {
    const nodeEl = document.createElement('div')
    nodeEl.textContent = node.name;
    nodeEl.style.color = "#1985A1";
    nodeEl.style.border = "1px solid #1985A1";
    nodeEl.style.background = "rgba(255,255,255,1)";
    nodeEl.className = 'node-label';

    return new CSS2DObject(nodeEl);
}

const node_dim = (node) => {

    const nodeEl = document.createElement('div');
    nodeEl.textContent = node.name;
    nodeEl.style.color = "#969da5";
    nodeEl.className = 'node-label';
    // setNodeOpacity(Graph, node, nodeEl);
    return new CSS2DObject(nodeEl);
}

class Head extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="head">
                <div className="left">
                    <div className="toggle" onClick={this.props.toggleHandler}>
                        <img src={this.props.icon} />
                    </div>
                    <div className="logo">
                        Complexverse <span>(Cubozoa Build)</span>
                    </div>
                </div>
                <div className="right">
                    <a href="#">Contribute</a>
                    <a href="#">About</a>
                </div>
            </div>
        );
    }
}

class Index extends React.Component {
    constructor(props) {
        super(props);
        this.search = this.search.bind(this);
    }

    search(query) {

    }

    render() {
        return (
            <div className='index' style={{
                transform: this.props.showIndex ? "translate(0%,0%)" : "translate(-100%,0%)"
            }}>
                <input type="text" class="search" onkeyup="this.search()" placeholder="Search.." />
                {
                    GraphList.map(graph => (
                        <a key={graph.id} href="#" onClick={() => this.props.selectHandler(graph.id)}>{graph.name} <span>{graph.lang}</span></a>
                    ))
                }
            </div>
        );
    }
}

class Details extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const sourceLinks = this.props.currentGraphSourceLinks.map((source) =>
            <li>{source.title}</li>
        );

        const contributors = this.props.currentGraphContributedBy.map((contributor) =>
            <li>{contributor}</li>
        );

        return (

            <div className="details" style={{
                transform: this.props.showIndex ? "translate(20rem,0%)" : "translate(0%,0%)",
                display: this.props.showDetails ? "flex" : "none"
            }}>
                <h1>{this.props.currentGraphName}<span>{this.props.currentGraphLang}</span></h1>
                <p>{this.props.currentGraphDescription}</p>
                <h6>Source</h6>
                <ul>{sourceLinks}</ul>
                <h6>Contributors</h6>
                <ul>{contributors}</ul>
                <div className="spacer"></div>
                <a className="download" href="{this.props.currentGraphDataSource}">Download graph data</a>
                <a className="edit" href="{this.props.currentGraphEditLink}">Edit this graph</a>
            </div>
        );
    }
}

class Graph extends React.Component {
    constructor(props) {
        super(props);

        this.getNode = this.getNode.bind(this);
        this.onNodeHover = this.onNodeHover.bind(this);
        this.onLinkHover = this.onLinkHover.bind(this);
        this.state = {
            count: 0
        };
        // this.update = this.update.bind(this);
        // this.updateHighlight = this.updateHighlight.bind(this);
    }

    getNode(id) {
        return this.data.nodes.find(node => node.id === id);
    }

    onNodeHover(node) {
        if ((!node && !this.highlightNodes.size) || (node && this.hoverNode === node)) return;

        this.highlightNodes.clear();
        this.highlightLinks.clear();
        if (node) {
            this.highlightNodes.add(node);
            node.neighbors.forEach(neighbor => this.highlightNodes.add(neighbor));
            node.links.forEach(link => this.highlightLinks.add(link));
        }

        this.hoverNode = node || null;
        // this.updateHighlight();

        if (this.hoverNode) {
            console.log("hovering " + this.hoverNode.id);
        }

        this.setState({ count: this.state.count + 1 });

    }

    onLinkHover(link) {
        this.highlightNodes.clear();
        this.highlightLinks.clear();

        if (link) {
            this.highlightLinks.add(link);
            this.highlightNodes.add(link.source);
            this.highlightNodes.add(link.target);
        }

        this.ref = React.createRef();
        this.setState({ count: this.state.count + 1 });
        // this.updateHighlight();
    }

    // updateHighlight() {
    //     this.setState({ 
    //         highlightNodes: this.highlightNodes, 
    //         highlightLinks: this.highlightLinks 
    //     });
    // }

    // update() {
    //     this.ref.scene().fog = new FogExp2("#fff", 0.0015);
    // }

    render() {

        if (this.state.count == 0) {
            this.data = {
                nodes: this.props.currentGraphNodes,
                links: this.props.currentGraphLinks
            };

            this.highlightNodes = new Set();
            this.highlightLinks = new Set();
            this.hoverNode = null;

            // cross-link node objects
            this.data.links.forEach(link => {
                const a = this.getNode(link.source);
                const b = this.getNode(link.target);
                !a.neighbors && (a.neighbors = []);
                !b.neighbors && (b.neighbors = []);
                a.neighbors.push(b);
                b.neighbors.push(a);

                !a.links && (a.links = []);
                !b.links && (b.links = []);
                a.links.push(link);
                b.links.push(link);
            });
        }
        // console.log(this.data);

        return (
            <div className="graph">
                <ForceGraph3D
                    extraRenderers={extraRenderers}
                    graphData={this.data}
                    backgroundColor={"rgb(255,255,255)"}
                    showNavInfo={false}
                    linkWidth={1}
                    nodeRelSize={5}
                    nodeResolution={8}
                    nodeOpacity={0}
                    autoPauseRedraw={true}
                    linkOpacity={1}
                    linkMaterial={link => this.highlightLinks.has(link) ? mat2 : mat1}
                    linkCurvature={0.05}
                    // nodeCanvasObjectMode={node => this.highlightNodes.has(node) ? 'before' : undefined}
                    nodeThreeObject={node => this.highlightNodes.has(node) ? node === this.hoverNode ? node_active(node) : node_default(node) : node_dim(node)}
                    nodeThreeObjectExtend={true}
                    onNodeHover={this.onNodeHover}
                    onLinkHover={this.onLinkHover}
                />
            </div>
        );
    }
}

class Body extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div className="body">
                <div className="pane">
                    <Index showIndex={this.props.showIndex} selectHandler={this.props.selectHandler} />
                    <Details
                        showIndex={this.props.showIndex}
                        showDetails={this.props.showDetails}
                        currentGraphID={this.props.currentGraphID}
                        currentGraphName={this.props.currentGraphName}
                        currentGraphLang={this.props.currentGraphLang}
                        currentGraphDescription={this.props.currentGraphDescription}
                        currentGraphSourceLinks={this.props.currentGraphSourceLinks}
                        currentGraphContributedBy={this.props.currentGraphContributedBy}
                        currentGraphDataSource={this.props.currentGraphDataSource}
                        currentGraphEditLink={this.props.currentGraphEditLink}
                    />
                </div>
                <Graph
                    currentGraphNodes={this.props.currentGraphNodes}
                    currentGraphLinks={this.props.currentGraphLinks}
                />
            </div>
        );
    }
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showIndex: false,
            showDetails: false,
            currentGraphID: 0,
            currentGraphName: "",
            currentGraphLang: "",
            currentGraphDescription: "",
            currentGraphSourceLinks: [],
            currentGraphContributedBy: [],
            currentGraphDataSource: "",
            currentGraphEditLink: "",
            currentGraphNodes: [],
            currentGraphLinks: []
        };
        this.toggleIndex = this.toggleIndex.bind(this);
        this.selectGraph = this.selectGraph.bind(this);
    }

    toggleIndex(e) {
        this.setState({ showIndex: !this.state.showIndex });
    }

    selectGraph(id) {
        this.setState({ currentGraphID: id });
        this.setState({ showDetails: true });
        const G = require(`./data/${id}.json`);
        this.setState({
            currentGraphName: G.meta.name,
            currentGraphLang: G.meta.lang,
            currentGraphDescription: G.meta.description,
            currentGraphSourceLinks: G.meta.sourceLinks,
            currentGraphContributedBy: G.meta.contributedBy,
            currentGraphDataSource: G.meta.dataSource,
            currentGraphEditLink: G.meta.editLink,
            currentGraphNodes: G.graph.nodes,
            currentGraphLinks: G.graph.links
        });
    }

    render() {
        return (
            <div>
                <Head icon={this.state.showIndex ? icon_Close : icon_Index} toggleHandler={this.toggleIndex} />
                <Body
                    showIndex={this.state.showIndex}
                    showDetails={this.state.showDetails}
                    selectHandler={this.selectGraph}
                    currentGraphID={this.state.currentGraphID}
                    currentGraphName={this.state.currentGraphName}
                    currentGraphLang={this.state.currentGraphLang}
                    currentGraphDescription={this.state.currentGraphDescription}
                    currentGraphSourceLinks={this.state.currentGraphSourceLinks}
                    currentGraphContributedBy={this.state.currentGraphContributedBy}
                    currentGraphDataSource={this.state.currentGraphDataSource}
                    currentGraphEditLink={this.state.currentGraphEditLink}
                    currentGraphNodes={this.state.currentGraphNodes}
                    currentGraphLinks={this.state.currentGraphLinks}
                />
            </div>
        );
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('root')
);
