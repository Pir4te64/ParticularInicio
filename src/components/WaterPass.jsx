import { Uniform, Vector2 } from "three";
import { Effect } from "postprocessing";

const fragmentShader = `
uniform float time;
uniform float factor;
uniform vec2 resolution;
uniform sampler2D tDiffuse;

void mainImage(const in vec2 uv, out vec4 fragColor) {
  vec2 p = uv * 2.0 - 1.0;
  float len = length(p);
  float ripple = sin(10.0 * len - time * 2.0) * 0.03;
  float glow = 0.15 / (len * 8.0 + 0.2);
  vec2 uv2 = uv + p * ripple * factor;
  vec4 color = texture2D(tDiffuse, uv2);
  color.rgb += glow * factor;
  fragColor = color;
}

void main() {
  mainImage(gl_FragCoord.xy / resolution.xy, gl_FragColor);
}
`;

export class WaterPass extends Effect {
  constructor({ factor = 0.4 } = {}) {
    super("WaterPass", fragmentShader, {
      uniforms: new Map([
        ["time", new Uniform(0)],
        ["factor", new Uniform(factor)],
        ["resolution", new Uniform(new Vector2())]
      ])
    });
  }

  update(renderer, inputBuffer, deltaTime) {
    this.uniforms.get("time").value += deltaTime;
    this.uniforms.get("resolution").value.set(
      renderer.domElement.width,
      renderer.domElement.height
    );
  }
} 