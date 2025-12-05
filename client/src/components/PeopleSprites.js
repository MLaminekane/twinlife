import { jsx as _jsx } from "react/jsx-runtime";
import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../state/store';
/**
 * Rendu alternatif utilisant des sprites (icônes 2D qui font toujours face à la caméra)
 * Mieux pour les vues de dessus ou quand on veut un style emoji/icône pour les gens
 */
export function PeopleSprites() {
    const people = useStore(s => s.people);
    const meshRef = useRef(null);
    const tempObject = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);
    // Créer une géométrie plane (fera toujours face à la caméra avec le matériau sprite)
    const geometry = useMemo(() => new THREE.PlaneGeometry(0.3, 0.3), []);
    // Créer un matériau de type sprite avec une texture de cercle simple
    const material = useMemo(() => {
        // Créer une texture canvas avec une icône de personne
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        // Dessiner une icône de personne simple (tête ronde + corps)
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(32, 20, 12, 0, Math.PI * 2); // Tête
        ctx.fill();
        ctx.fillRect(26, 32, 12, 20); // Corps
        ctx.fillRect(20, 40, 8, 12); // Jambe gauche
        ctx.fillRect(36, 40, 8, 12); // Jambe droite
        const texture = new THREE.CanvasTexture(canvas);
        return new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.1
        });
    }, []);
    useFrame(({ camera }) => {
        if (!meshRef.current)
            return;
        const mesh = meshRef.current;
        for (let i = 0; i < people.length; i++) {
            const person = people[i];
            tempObject.position.set(person.position[0], person.position[1] + 0.15, // Légèrement surélevé
            person.position[2]);
            // Faire en sorte que le sprite fasse face à la caméra (effet billboard)
            tempObject.quaternion.copy(camera.quaternion);
            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);
            // Couleur selon le genre
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
    return (_jsx("instancedMesh", { ref: meshRef, args: [geometry, material, people.length] }));
}
