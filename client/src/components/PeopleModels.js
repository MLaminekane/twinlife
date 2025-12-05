import { jsx as _jsx } from "react/jsx-runtime";
import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../state/store';
/**
 * Advanced rendering using custom 3D models
 * Place a .glb/.gltf model in public/models/person.glb
 */
export function PeopleModels() {
    const people = useStore(s => s.people);
    const glow = useStore(s => s.settings.glow);
    const meshRef = useRef(null);
    const tempObject = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);
    // Load 3D model (you need to add person.glb to your public/models folder)
    // Alternative: use a simple custom geometry
    const geometry = useMemo(() => {
        // Create a simple humanoid shape with boxes
        const group = new THREE.Group();
        // Head
        const head = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const headMesh = new THREE.Mesh(head);
        headMesh.position.y = 0.25;
        // Body
        const body = new THREE.BoxGeometry(0.12, 0.2, 0.08);
        const bodyMesh = new THREE.Mesh(body);
        bodyMesh.position.y = 0.1;
        // Merge geometries for better performance
        const mergedGeometry = new THREE.BufferGeometry();
        const geometries = [head, body].map((geo, i) => {
            const mesh = i === 0 ? headMesh : bodyMesh;
            const cloned = geo.clone();
            cloned.applyMatrix4(mesh.matrix);
            return cloned;
        });
        // Or use a simple cone/capsule as humanoid
        return new THREE.CapsuleGeometry(0.06, 0.25, 4, 8);
    }, []);
    const material = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: '#60a5fa',
            roughness: 0.6,
            metalness: 0.1,
            emissive: glow ? '#60a5fa' : '#000000',
            emissiveIntensity: glow ? 0.2 : 0
        });
    }, [glow]);
    useFrame(() => {
        if (!meshRef.current)
            return;
        const mesh = meshRef.current;
        for (let i = 0; i < people.length; i++) {
            const person = people[i];
            tempObject.position.set(person.position[0], person.position[1] + 0.15, // Slight elevation
            person.position[2]);
            // Add rotation based on movement direction (optional)
            const target = person.targetBuildingId;
            // You could calculate rotation to face target here
            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);
            // Color variation
            if (person.gender === 'male') {
                tempColor.setHex(0x60a5fa);
            }
            else if (person.gender === 'female') {
                tempColor.setHex(0xf472b6);
            }
            else {
                tempColor.setHex(0x60a5fa);
            }
            mesh.setColorAt(i, tempColor);
        }
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor)
            mesh.instanceColor.needsUpdate = true;
    });
    if (people.length === 0)
        return null;
    return (_jsx("instancedMesh", { ref: meshRef, args: [geometry, material, people.length], castShadow: true, receiveShadow: true }));
}
