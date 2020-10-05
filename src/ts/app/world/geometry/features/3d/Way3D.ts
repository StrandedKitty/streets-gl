import Feature3D, {Tags} from "./Feature3D";
import Node3D from "./Node3D";
import earcut from 'earcut';
import HeightViewer from "../../../HeightViewer";
import {toRad} from "../../../../../math/Utils";
import Vec2 from "../../../../../math/Vec2";

export default class Way3D extends Feature3D {
    public nodes: Node3D[];
    public vertices: [number, number][];
    private maxGroundHeight: number;
    private minGroundHeight: number;
    private heightViewer: HeightViewer;

    constructor(id: number, nodes: Node3D[], tags: Tags, heightViewer: HeightViewer) {
        super(id, tags);

        this.nodes = nodes;
        this.heightViewer = heightViewer;
        this.vertices = [];

        for(const node of this.nodes) {
            this.vertices.push([node.position.x, node.position.y]);
        }

        this.fixDirection();
    }

    public getVertices(): Float32Array {
        if(this.tags.type !== 'building') {
            return new Float32Array();
        }

        this.updateFootprintHeight();

        const footprint = this.triangulateFootprint();
        const walls = this.triangulateWalls();

        return new Float32Array(footprint.concat(walls));
    }

    private isClockwise(): boolean {
        let sum = 0;

        for(let i = 0; i < this.nodes.length; i++) {
            const point1 = this.vertices[i];
            const point2 = this.vertices[i + 1] || this.vertices[0];
            sum += (point2[0] - point1[0]) * (point2[1] + point1[1]);
        }

        return sum > 0;
    }

    private fixDirection() {
        if(!this.isClockwise()) {
            this.nodes.reverse();
            this.vertices.reverse();
        }
    }

    private updateFootprintHeight() {
        let maxHeight = -Infinity;
        let minHeight = Infinity;

        for (const node of this.nodes) {
            const tileX = Math.floor(node.tile.x);
            const tileY = Math.floor(node.tile.y);

            //if (this.heightViewer.isTileLoaded(tileX, tileY)) {
                minHeight = Math.min(minHeight, this.heightViewer.getHeight(tileX, tileY, node.tile.x % 1, node.tile.y % 1));
                maxHeight = Math.max(maxHeight, this.heightViewer.getHeight(tileX, tileY, node.tile.x % 1, node.tile.y % 1));
            //}
        }

        if(minHeight === Infinity) {
            minHeight = 0;
        }

        if(maxHeight === -Infinity) {
            minHeight = 0;
        }

        this.minGroundHeight = minHeight;
        this.maxGroundHeight = maxHeight;
    }

    private getFlattenVertices(): number[] {
        return this.vertices.flat();
    }

    private calculateLength() {
        let length = 0;

        for(let i = 0; i < this.vertices.length - 1; i++) {
            const point1 = this.vertices[i];
            const point2 = this.vertices[i + 1];
            length += Math.sqrt((point2[0] - point1[0]) ** 2 + (point2[1] - point1[1]) ** 2);
        }

        return length;
    }

    private triangulateFootprint(): number[] {
        const vertices = this.getFlattenVertices();
        const triangles = earcut(vertices, []).reverse();
        const result = [];

        for(let i = 0; i < triangles.length; i++) {
            result.push(vertices[triangles[i] * 2], this.minGroundHeight + (+this.tags.height || 6), vertices[triangles[i] * 2 + 1]);
        }

        return result;
    }

    private triangulateWalls(): number[] {
        const height = (+this.tags.height || 6) + this.minGroundHeight;
        const minHeight = (+this.tags.minHeight || 0) + this.minGroundHeight;
        const vertices: number[] = [];

        for (let i = 0; i < this.vertices.length - 1; i++) {
            const vertex = {x: this.vertices[i][0], z: this.vertices[i][1]};
            const nextVertex = {x: this.vertices[i + 1][0], z: this.vertices[i + 1][1]};

            vertices.push(nextVertex.x, minHeight, nextVertex.z);
            vertices.push(vertex.x, height, vertex.z);
            vertices.push(vertex.x, minHeight, vertex.z);

            vertices.push(nextVertex.x, minHeight, nextVertex.z);
            vertices.push(nextVertex.x, height, nextVertex.z);
            vertices.push(vertex.x, height, vertex.z);
        }

        return vertices;
    }
}