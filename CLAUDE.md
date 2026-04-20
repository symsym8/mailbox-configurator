# CONTEXT_BRIDGE — Configurateur de Boîtes aux Lettres CTS

## 1. Présentation du projet

Application web interactive permettant aux clients de CTS de configurer leur bloc de boîtes aux lettres, visualiser le rendu en 2D et 3D en temps réel et exporter un PDF récapitulatif.

---

## 2. Stack technique

| Technologie                         | Usage              |
| ----------------------------------- | ------------------ |
| React + Vite                        | Framework frontend |
| shadcn/ui                           | Composants UI      |
| Tailwind CSS                        | Styles             |
| jsPDF + html2canvas                 | Export PDF         |
| SVG inline                          | Rendu visuel 2D    |
| Three.js + React Three Fiber + Drei | Rendu 3D           |
| VS Code + Claude Code               | Développement      |
| Vercel / Netlify                    | Hébergement        |

---

## 3. Architecture des dossiers

```
mailbox-configurator/
├── public/
│   ├── image/                  # SVG des boîtes aux lettres (vue 2D)
│   │   ├── elite_A1.svg
│   │   ├── elite_A2.svg
│   │   ├── elite_A3.svg
│   │   ├── elite_B2.svg
│   │   ├── elite_B4.svg
│   │   ├── elite_B6.svg
│   │   ├── discretion_A1.svg
│   │   ├── discretion_A2.svg
│   │   └── discretion_A3.svg
│   ├── elite_B4.glb            # Modèle 3D GLB (vue 3D)
│   └── logo.png                # Logo CTS
├── src/
│   ├── components/             # Composants React
│   ├── App.jsx                 # Composant principal
│   └── main.jsx                # Point d'entrée
├── CLAUDE.md                   # Mémoire Claude Code
├── package.json
└── vite.config.js
```

---

## 4. Fonctionnement des SVG (Vue 2D)

Les SVG sont exportés depuis AutoCAD via ce workflow :
**SolidWorks → DXF → AutoCAD → PDF vectoriel → Inkscape → SVG**

Chaque SVG contient des calques AutoCAD identifiés par des couleurs distinctes :

| Couleur dans le SVG | Élément            | Colorisable ?        |
| ------------------- | ------------------ | -------------------- |
| Rouge vif RAL 3026  | COFFRE             | ✅ Oui               |
| Bleu vif RAL 5012   | CADRE              | ✅ Oui               |
| Vert vif RAL 6038   | PORTILLON          | ✅ Oui               |
| Jaune vif RAL 1016  | AILETTE + SERRURES | ❌ Fixe inox #C0C0C0 |

Dans React, le SVG est chargé en inline, puis chaque élément est détecté par sa couleur de remplissage et remplacé par la couleur RAL choisie par le client en temps réel.

---

## 5. Workflow de création des fichiers GLB (Vue 3D)

1. **SolidWorks** → Appliquer les couleurs par zone via "Apparences" :
   - Rouge → COFFRE
   - Cyan → CADRE
   - Vert → PORTILLON
   - Jaune → AILETTE + SERRURES
2. **Export STEP AP214** depuis SolidWorks :
   - Fichier → Enregistrer sous → STEP AP214
   - Options → cocher "Export appearances" ✅
   - Options → cocher "Face/edge properties" ✅
3. **convert3d.org** → Upload STEP → Télécharger GLB (garde les couleurs) ✅
4. Déposer le GLB dans `public/`

### Intégration Three.js dans React

- Librairies : `three@0.160.0` + `@react-three/fiber@8.15.0` + `@react-three/drei@9.88.0`
- Le GLB est chargé avec `useGLTF('/nom_fichier.glb')`
- Les meshes sont détectés par leur couleur RGB dans le GLB
- La couleur RAL choisie remplace la couleur d'identification en temps réel
- `OrbitControls` permet de tourner/zoomer le modèle

### Mapping des couleurs GLB → RAL

| Couleur GLB (RGB)       | Zone             | Action                      |
| ----------------------- | ---------------- | --------------------------- |
| rgb(1, 0, 0) rouge      | COFFRE           | Remplacer par RAL coffre    |
| rgb(0, 1, 1) cyan       | CADRE            | Remplacer par RAL cadre     |
| rgb(0, 1, 0) vert       | PORTILLON        | Remplacer par RAL portillon |
| rgb(1, 1, 0) jaune      | AILETTE+SERRURES | Fixer à #C0C0C0 inox        |
| rgb(0.6, 0.6, 0.6) gris | Serrures         | Garder tel quel             |

---

## 6. Gammes et modèles

### Gammes disponibles

- **ELITE** — Anti-effraction grade 5, portillon galbé, avec ailette anti-retour
- **DISCRETION** — Entrée de gamme, portillon plat, sans ailette

### Modèles disponibles

| Modèle | Description | Hauteur | Largeur | Profondeur |
| ------ | ----------- | ------- | ------- | ---------- |
| A1     | 1 boîte     | 359 mm  | 424 mm  | 365 mm     |
| A2     | 2 boîtes    | 638 mm  | 424 mm  | 365 mm     |
| A3     | 3 boîtes    | 918 mm  | 424 mm  | 365 mm     |
| B2     | 2 boîtes    | 359 mm  | 732 mm  | 365 mm     |
| B4     | 4 boîtes    | 638 mm  | 732 mm  | 365 mm     |
| B6     | 6 boîtes    | 918 mm  | 732 mm  | 365 mm     |

---

## 7. Nuancier RAL (21 couleurs)

| Nom               | Code RAL | Hex     |
| ----------------- | -------- | ------- |
| Jaune zinc        | RAL 1018 | #F3A505 |
| Rouge saumon      | RAL 3022 | #D56D56 |
| Rouge rubis       | RAL 3003 | #8E1728 |
| Brun rouge        | RAL 8012 | #6C3B2A |
| Brun chocolat     | RAL 8017 | #442F29 |
| Noir graphite     | RAL 9011 | #1F1F1F |
| Gris graphite     | RAL 7024 | #474A50 |
| Gris poussière    | RAL 7037 | #7D7F7D |
| Aluminium blanc   | RAL 9006 | #A5A5A5 |
| Gris anthracite   | RAL 7016 | #383E42 |
| Blanc perle       | RAL 1013 | #E9E0D1 |
| Gris silex        | RAL 7032 | #B5B0A1 |
| Ivoire clair      | RAL 1015 | #E6D2B5 |
| Blanc de sécurité | RAL 9003 | #F4F4F4 |
| Vert blanc        | RAL 6019 | #CFE5CE |
| Vert de sécurité  | RAL 6032 | #237F52 |
| Vert mousse       | RAL 6005 | #1F3A2D |
| Vert clair        | RAL 6027 | #7DC4BC |
| Bleu d'eau        | RAL 5021 | #1B8A91 |
| Bleu ciel         | RAL 5015 | #1F6EA2 |
| Bleu outremer     | RAL 5002 | #1A2B6D |

---

## 8. Interface utilisateur

- Layout 2 colonnes (PC) / 1 colonne (mobile)
- Panneau gauche : configuration en sections
- Panneau droit : aperçu temps réel + export PDF
- Bouton toggle **Vue 2D / Vue 3D**
- Seul le **DESCRIPTIF TECHNIQUE** est en accordéon

### Sections configuration

1. GAMME
2. DESCRIPTIF TECHNIQUE (accordéon)
3. MODÈLE
4. COULEURS
5. CLIENT (Nom, Prénom, Email, Société, Adresse livraison)

---

## 9. Export PDF (2 pages)

- Page 1 : Logo CTS, infos client, config, couleurs, dimensions, aperçu, date
- Page 2 : Descriptif technique selon gamme

---

## 10. État d'avancement

### ✅ Fait

- Interface React complète PC + mobile
- SVG 2D avec colorisation RAL temps réel
- Viewer 3D Three.js avec GLB
- Toggle Vue 2D / Vue 3D
- Export PDF 2 pages
- Nuancier RAL 21 couleurs
- Formulaire client complet
- Descriptif technique accordéon
- Déployé sur Netlify
- GitHub : github.com/symsym8/mailbox-configurator

### ⚠️ En cours

- Ajustement couleurs 3D — couleurs claires et sombres fidèles aux RAL simultanément

### 🔜 À faire

- Ajouter GLB pour A1, A2, A3, B2, B6, DISCRETION
- Déploiement sur domaine CTS

---

## 11. Points techniques importants

- **Ne jamais utiliser les PNG** — obsolètes, seuls SVG et GLB sont utilisés
- **SVG chargé inline** — obligatoire pour modifier les couleurs via JS
- **GLB créé via** : SolidWorks → STEP AP214 → convert3d.org → GLB
- **StrictMode retiré** de main.jsx — causait Context Lost WebGL
- **Versions Three.js** : `three@0.160.0` + `@react-three/fiber@8.15.0` + `@react-three/drei@9.88.0`
- **DISCRETION** : pas d'ailette, 3 zones seulement
- **AILETTE + serrures** : toujours #C0C0C0 fixe, jamais colorisable
- Chemin projet : `C:\Users\User12\Desktop\mailbox-configurator`
- Node.js : v24.14.1
- GitHub : github.com/symsym8/mailbox-configurator
