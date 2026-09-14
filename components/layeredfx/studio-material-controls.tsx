"use client";

import {Slider} from './ui/slider';

type Props = {
  scale: number; rotation: number; opacity: number;
  onScale: (value: number) => void;
  onRotation: (value: number) => void;
  onOpacity: (value: number) => void;
};

export function StudioMaterialControls({scale, rotation, opacity, onScale, onRotation, onOpacity}: Props) {
  const controls = [
    {label: 'Pattern Scale', value: scale, min: 60, max: 350, step: 1, display: `${scale}%`, change: onScale},
    {label: 'Rotation', value: rotation, min: 0, max: 180, step: 15, display: `${rotation}°`, change: onRotation},
    {label: 'Blend Strength', value: opacity, min: 0, max: 1, step: .01, display: `${Math.round(opacity * 100)}%`, change: onOpacity},
  ];
  return <div className="ws-material-controls" role="group" aria-label="Material adjustments">
    {controls.map(control => <div className="ws-material-control" key={control.label}>
      <div><span>{control.label}</span><output>{control.display}</output></div>
      <Slider label={control.label} value={[control.value]} min={control.min} max={control.max} step={control.step}
        aria-valuetext={control.display} onValueChange={values => control.change(values[0])}/>
    </div>)}
  </div>;
}
