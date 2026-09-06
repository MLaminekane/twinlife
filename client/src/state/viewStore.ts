import { create } from 'zustand'
export type Layer = 'standard' | 'activity' | 'mobility'
export type CameraPreset = 'overview' | 'campus' | 'downtown' | 'top'
export type Panel =
  'overview' | 'buildings' | 'people' | 'scenarios' | 'settings' | 'assistant'
type ViewState = {
  layer: Layer
  panel: Panel
  cameraPreset: CameraPreset
  cameraRequest: number
  cinematic: boolean
  quality: 'high' | 'balanced'
  focus: (preset: CameraPreset) => void
}
export const useView = create<ViewState>((set) => ({
  layer: 'standard',
  panel: 'overview',
  cameraPreset: 'overview',
  cameraRequest: 0,
  cinematic: false,
  quality: 'high',
  focus: (cameraPreset) =>
    set((s) => ({
      cameraPreset,
      cameraRequest: s.cameraRequest + 1,
      cinematic: false,
    })),
}))
