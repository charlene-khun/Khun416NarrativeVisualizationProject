# 2017 Automobile Efficiency — D3 Narrative Visualization

This project is an **interactive slideshow** with three D3 scenes built from `cars2017.csv`.

## Project files

- `index.html` — page structure and D3 script references
- `styles.css` — layout, responsive design, annotations, controls, and tooltip styling
- `script.js` — data loading, state parameters, scene construction, annotations, and triggers
- `cars2017.csv` — source dataset
- `essay.pdf` — submission-ready explanation of the narrative visualization

## Narrative structure

The visualization uses the interactive slideshow structure:

1. Engine cylinders vs. highway MPG
2. City MPG vs. highway MPG
3. Average efficiency by fuel type

Each scene includes a persistent annotation, free-form hover tooltips, and navigation triggers. The JavaScript state variables `state.scene` and `state.activeFuel` act as the main parameters controlling what is displayed.
