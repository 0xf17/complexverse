import React from 'react';
import ReactDOM from 'react-dom';
import './main.scss';
import icon_Index from './img/index.svg';
import icon_Close from './img/close.svg';
import logo from './img/ms_logo.svg';
import GraphList from './graphlist.json';
import ForceGraph3D from 'react-force-graph-3d';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Vector3, LineBasicMaterial, FogExp2 } from 'three';

const extraRenderers = [new CSS2DRenderer()];
const mat1 = new LineBasicMaterial({ color: "#dcdcdd" });
const mat2 = new LineBasicMaterial({ color: "#1985A1" });

function map(value, x1, y1, x2, y2) {
    return (value - x1) * (y2 - x2) / (y1 - x1) + x2;
}

function distanceVector(v1, v2) {
    var dx = v1.x - v2.x;
    var dy = v1.y - v2.y;
    var dz = v1.z - v2.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function getNode(nodes, id) {
    return nodes.find(node => node.id === id);
}

function getLink(links, src_id, dest_id) {
    return links.find(link =>
        ((link.source.id === src_id) && (link.target.id === dest_id)) ||
        ((link.source.id === dest_id) && (link.target.id === src_id)));
}

function setNodeOpacity(cam, node, nodeEl) {
    let pos = new Vector3(0, 0, 0);

    if (node.x) {
        pos = new Vector3(node.x, node.y, node.z);
    }

    let dist = distanceVector(cam.position, pos);

    let op = map(dist, 500, 0, 0, 1);
    nodeEl.style.opacity = op;
}

function getLinkOpacity(cam, link) {
    let dist = distanceVector(cam.position, link.source.position);
    return map(dist, 500, 0, 0, 1);
}

const node_active = (cam, node) => {
    const nodeEl = document.createElement('div');
    nodeEl.textContent = node.name;
    nodeEl.className = 'node-label active';
    return new CSS2DObject(nodeEl);
}

const node_default = (cam, node) => {
    const nodeEl = document.createElement('div')
    nodeEl.textContent = node.name;
    nodeEl.className = 'node-label default';
    return new CSS2DObject(nodeEl);
}

const node_dim = (cam, node) => {
    const nodeEl = document.createElement('div');
    nodeEl.textContent = node.name;
    nodeEl.className = 'node-label';
    setNodeOpacity(cam, node, nodeEl);
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
                    <a className="logo" href="/">
                        Complexverse
                    </a>
                </div>
                <div className="right">
                    <a href="#">Contribute</a>
                    <a href="#">About Complexverse</a>
                    <a href="#" className="opacity-50">v0.1.0</a>
                </div>
            </div>
        );
    }
}

class EngineControls extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="engine-controls">
                <select id="cars" name="cars" onChange={this.props.engineHandler}>
                    <option value={false}>false</option>
                    <option value={true}>true</option>
                </select>
            </div>
        );
    }
}
class Index extends React.Component {
    constructor(props) {
        super(props);
        this.search = this.search.bind(this);
    }

    search() {
        var input, filter, p, name;
        input = document.getElementById("searchbox");
        console.log(input.value);
        filter = input.value.toUpperCase();
        let links = document.getElementsByClassName("graph-link");
        for (let i = 0; i < links.length; i++) {
            let a = links[i];
            name = a.innerText;
            if (name.toUpperCase().indexOf(filter) > -1) {
                a.style.display = "";
            } else {
                a.style.display = "none";
            }
        }
    }

    render() {
        return (
            <div className='index' style={{
                transform: this.props.showIndex ? "translate(0%,0%)" : "translate(-100%,0%)"
            }}>
                <input type="text" id="searchbox" className="search" onKeyUp={this.search} placeholder="Search.." />
                {
                    GraphList.map(graph => (
                        <a key={graph.id} className="graph-link" href="#" onClick={() => this.props.selectHandler(graph.id)}>{graph.name} <span>{graph.lang}</span></a>
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
        var sourceLinks = "", authors = "";
        if (this.props.meta !== null) {
            sourceLinks = this.props.meta.sourceLinks.map((source) =>
                <li><a href={source.url}>{source.title}</a></li>
            );

            authors = this.props.meta.contributedBy.map((author) =>
                <li><a href={"github.com/" + author}>{author}</a></li>
            );
        }

        return (

            <div className="details" style={{
                transform: this.props.showIndex ? "translate(20rem,0%)" : "translate(0%,0%)",
                display: this.props.showDetails ? "flex" : "none"
            }}>
                <h1>{this.props.meta.name}<span>{this.props.meta.lang}</span></h1>
                <p>{this.props.meta.description}</p>

                <h6>Source</h6>
                <ul>{sourceLinks}</ul>
                <h6>Contributors</h6>
                <ul>{authors}</ul>
                {/* <div className="spacer"></div> */}
                <h6>Graph Actions</h6>
                <div className="actions">
                    <a className="download" href="{this.props.meta.dataSource}">Download</a>
                    <a className="edit" href="{this.props.meta.editLink}">Edit on GH</a>
                </div>

            </div>
        );
    }
}

class Graph extends React.Component {
    constructor(props) {
        super(props);
        this.onNodeHover = this.onNodeHover.bind(this);
        this.onLinkHover = this.onLinkHover.bind(this);
        this.ref = React.createRef();

        this.hoverNode = null;
        this.highlightNodes = new Set();
        this.highlightLinks = new Set();

        this.addNodeToHighlighted = this.addNodeToHighlighted.bind(this);
        this.addLinkToHighlighted = this.addLinkToHighlighted.bind(this);
        this.resetHighlights = this.resetHighlights.bind(this);

        this.state = { count: 0 };
    }

    resetHighlights() {
        this.hoverNode = null;
        this.highlightNodes = new Set();
        this.highlightLinks = new Set();
    }

    addNodeToHighlighted(node) {
        this.highlightNodes.add(node);
    }

    addLinkToHighlighted(link) {
        this.highlightLinks.add(link);
    }

    onNodeHover(node) {
        // console.log("entered onNodeHover");

        if ((!node && !this.highlightNodes.size) || (node && this.hoverNode === node)) return;
        this.resetHighlights();

        if (node) {
            this.addNodeToHighlighted(node);
            for (let neighbor of node.neighbors) {
                // console.log("Added " + neighbor + " to highlight");
                this.addNodeToHighlighted(getNode(this.props.data.nodes, neighbor));
                this.addLinkToHighlighted(getLink(this.props.data.links, node.id, neighbor));
            }
        }

        this.hoverNode = node || null;

        this.setState({ count: this.state.count + 1 });
    }

    onLinkHover(link) {
        // console.log("entered onLinkHover");
        this.resetHighlights();

        if (link) {
            this.addLinkToHighlighted(link);
            this.addNodeToHighlighted(link.source);
            this.addNodeToHighlighted(link.target);
        }

        this.setState({ count: this.state.count + 1 });
    }

    componentDidMount() {
        let Graph = this.ref.current;

        // let scene = Graph.scene();
        // scene.fog = new FogExp2("#fff", 0.0015);
        // Graph.pauseAnimation();
        Graph.controls().addEventListener('change', Graph.refresh);
        console.log(this.ref.current.renderer().info.render);
    }

    render() {
        let obj = (
            <div className="graph">
                <ForceGraph3D
                    ref={this.ref}
                    rendererConfig={{ powerPreference: "low-power", alpha: true }}
                    extraRenderers={extraRenderers}
                    graphData={this.props.data}
                    backgroundColor={"rgba(0,0,0,0)"}
                    showNavInfo={false}
                    linkWidth={0.5}
                    warmupTicks={1000}
                    cooldownTime={3000}
                    nodeRelSize={5}
                    nodeResolution={2}
                    nodeOpacity={0}
                    linkMaterial={link => this.highlightLinks.has(link) ? mat2 : mat1}
                    linkCurvature={0.025}
                    nodeThreeObject={node => this.highlightNodes.has(node) ? node === this.hoverNode ? node_active(this.ref.current.camera(), node) : node_default(this.ref.current.camera(), node) : node_dim(this.ref.current.camera(), node)}
                    nodeThreeObjectExtend={true}
                    onNodeHover={this.onNodeHover}
                    onLinkHover={this.onLinkHover}
                />
            </div>);

        return obj;
    }
}

class Body extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div className="body" id="body">
                <div className="pane">
                    <Index showIndex={this.props.showIndex} selectHandler={this.props.selectHandler} />
                    <Details
                        showIndex={this.props.showIndex}
                        showDetails={this.props.showDetails}
                        meta={this.props.G.meta}
                    />
                </div>
                <Graph
                    data={this.props.G.data}
                />
            </div>
        );
    }
}

class Logo extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <a className="logo" href="https://mathscapes.xyz">
                <img src={logo} alt="Mathscapes" />
            </a>
        );
    }
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showIndex: false,
            showDetails: false,
            G: { meta: { sourceLinks: [], contributedBy: [] }, data: { nodes: [], links: [] } },
            value: false,
            G_id: null
        };
        this.toggleIndex = this.toggleIndex.bind(this);
        this.selectGraph = this.selectGraph.bind(this);
        this._G = null;
    }

    toggleIndex(e) {
        this.setState({ showIndex: !this.state.showIndex });
    }

    selectGraph(id) {
        if (this.state.G_id !== id) {
            // ReactDOM.unmountComponentAtNode(document.getElementById('root'));
            this._G = require(`./data/${id}.json`);;

            this.setState({
                G_id: id,
                showDetails: true,
                G: this._G
            });

        }
    }

    engineHandler(e) {
        this.setState({ value: e.target.value });
    }

    render() {
        return (
            <div>
                <Head
                    icon={this.state.showIndex ? icon_Close : icon_Index}
                    toggleHandler={this.toggleIndex}
                />
                <Body
                    showIndex={this.state.showIndex}
                    showDetails={this.state.showDetails}
                    selectHandler={this.selectGraph}
                    G={this.state.G}
                    value={this.state.value}
                />
                <Logo />
            </div>
        );
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('root')
);