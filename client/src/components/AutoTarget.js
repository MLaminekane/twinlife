import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../state/store';
export function AutoTarget() {
    const selectedId = useStore(s => s.selectedPersonId);
    const { camera, controls } = useThree((s) => ({ camera: s.camera, controls: s.controls }));
    useFrame(() => {
        if (selectedId)
            return; // FocusCamera drives target
        const cam = camera;
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).normalize();
        // Intersect with ground plane y=0
        const EPS = 1e-4;
        if (Math.abs(dir.y) < EPS)
            return;
        const t = -cam.position.y / dir.y;
        if (t <= 0)
            return;
        const point = new THREE.Vector3().copy(cam.position).addScaledVector(dir, t);
        if (controls?.target) {
            ;
            controls.target.copy(point);
            controls.update?.();
        }
    });
    return null;
}
