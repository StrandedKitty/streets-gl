import Renderer from "./Renderer";
import GLConstants from "./GLConstants";
import Texture2D from "./Texture2D";
import Texture3D from "./Texture3D";
import Texture2DArray from "./Texture2DArray";

export default class Framebuffer {
	private readonly gl: WebGL2RenderingContext;
	private readonly renderer: Renderer;
	public readonly textures: Texture2D[];
	public width: number;
	public height: number;
	public readonly usesDepth: boolean;
	public depthTexture: Texture2D | Texture2DArray | Texture3D;
	public readonly WebGLFramebuffer: WebGLFramebuffer;

	constructor(renderer: Renderer, {
		textures,
		width,
		height,
		usesDepth = false
	}: {
		textures: Texture2D[],
		width: number,
		height: number,
		usesDepth?: boolean
	}) {
		this.renderer = renderer;
		this.gl = renderer.gl;

		this.textures = textures;
		this.width = width;
		this.height = height;
		this.WebGLFramebuffer = this.gl.createFramebuffer();
		this.usesDepth = usesDepth;

		this.renderer.bindFramebuffer(this);

		const attachments = [];

		for(let i = 0; i < this.textures.length; i++) {
			const attachment = GLConstants.COLOR_ATTACHMENT0 + i;
			this.gl.framebufferTexture2D(GLConstants.FRAMEBUFFER, attachment, GLConstants.TEXTURE_2D, this.textures[i].WebGLTexture, 0);
			attachments.push(attachment);
		}

		if(this.usesDepth) {
			this.depthTexture = new Texture2D(this.renderer, {
				width: this.width,
				height: this.height,
				minFilter: GLConstants.NEAREST,
				magFilter: GLConstants.NEAREST,
				wrap: GLConstants.CLAMP_TO_EDGE,
				internalFormat: GLConstants.DEPTH_COMPONENT32F,
				format: GLConstants.DEPTH_COMPONENT,
				type: GLConstants.FLOAT
			});

			this.gl.framebufferTexture2D(GLConstants.FRAMEBUFFER, GLConstants.DEPTH_ATTACHMENT, GLConstants.TEXTURE_2D, this.depthTexture.WebGLTexture, 0);
		}

		this.gl.drawBuffers(attachments);

		this.renderer.bindFramebuffer(null);
	}

	public attachTexture3DLayer(texture: Texture3D | Texture2DArray, layer: number) {
		this.renderer.bindFramebuffer(this);

		this.renderer.gl.framebufferTextureLayer(GLConstants.FRAMEBUFFER, GLConstants.COLOR_ATTACHMENT0, texture.WebGLTexture, 0, layer);
		this.gl.drawBuffers([GLConstants.COLOR_ATTACHMENT0]);

		this.renderer.bindFramebuffer(null);
	}

	public attachTexture3DLayerToDepth(texture: Texture3D | Texture2DArray, layer: number) {
		this.renderer.bindFramebuffer(this);

		this.renderer.gl.framebufferTextureLayer(GLConstants.FRAMEBUFFER, GLConstants.DEPTH_ATTACHMENT, texture.WebGLTexture, 0, layer);
		this.depthTexture = texture;

		this.renderer.bindFramebuffer(null);
	}

	public setSize(width: number, height: number) {
		this.width = width;
		this.height = height;

		this.renderer.bindFramebuffer(this);

		if(this.depthTexture) {
			this.depthTexture.setSize(width, height);
		}

		for(let i = 0; i < this.textures.length; i++) {
			this.textures[i].setSize(width, height);
		}

		this.renderer.bindFramebuffer(null);
	}
}
