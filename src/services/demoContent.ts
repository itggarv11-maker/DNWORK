
import { Subject, ClassLevel } from '../types';

export interface DemoChapter {
    id: string;
    title: string;
    subject: Subject;
    classLevel: ClassLevel;
    content: string;
}

export const demoChapters: DemoChapter[] = [
    {
        id: 'phy10_light',
        title: 'Light - Reflection & Refraction',
        subject: Subject.Physics,
        classLevel: 'Class 10',
        content: `
Light is a form of energy that enables us to see. It travels in straight lines. We can see objects when light from them reaches our eyes.

Reflection of Light:
When light falls on a highly polished surface like a mirror, most of the light is sent back into the same medium. This process is called reflection of light.

Laws of Reflection:
1. The angle of incidence is equal to the angle of reflection. (∠i = ∠r)
2. The incident ray, the normal to the mirror at the point of incidence, and the reflected ray, all lie in the same plane.

Spherical Mirrors:
Mirrors whose reflecting surfaces are spherical are called spherical mirrors. There are two types:
1. Concave Mirror: The reflecting surface is curved inwards. It can form real, inverted images as well as virtual, erect images.
2. Convex Mirror: The reflecting surface is curved outwards. It always forms a virtual, erect, and diminished image.

Mirror Formula:
The relationship between the object distance (u), image distance (v), and focal length (f) is given by the mirror formula:
1/v + 1/u = 1/f

Magnification (m):
It is the ratio of the height of the image (h') to the height of the object (h).
m = h'/h = -v/u

Refraction of Light:
The bending of light when it enters obliquely from one transparent medium to another is called refraction of light. This happens because the speed of light is different in different media.

Laws of Refraction (Snell's Law):
The ratio of the sine of the angle of incidence to the sine of the angle of refraction is a constant, for the light of a given color and for the given pair of media. This constant is called the refractive index.
sin(i) / sin(r) = constant = n₂₁

Lens Formula:
1/v - 1/u = 1/f

Power of a Lens (P):
The degree of convergence or divergence of light rays achieved by a lens. It is the reciprocal of its focal length. P = 1/f. The SI unit of power is dioptre (D).
        `
    },
    {
        id: 'bio9_cell',
        title: 'The Fundamental Unit of Life - Cell',
        subject: Subject.Biology,
        classLevel: 'Class 9',
        content: `
All living organisms are made up of fundamental units called cells. The cell is the basic structural and functional unit of life.

The Cell Theory states that:
1. All plants and animals are composed of cells.
2. The cell is the basic unit of life.
3. All cells arise from pre-existing cells.

A typical cell has three main components: Plasma Membrane, Nucleus, and Cytoplasm.

Cell Organelles:
- Endoplasmic Reticulum (ER): A network for transport. Rough ER has ribosomes for protein synthesis, Smooth ER makes fats.
- Golgi Apparatus: Packages and dispatches materials.
- Lysosomes: "Suicide bags" that clean the cell by digesting waste and foreign material.
- Mitochondria: "Powerhouses" of the cell, generating energy as ATP.
- Plastids: Found in plant cells. Chloroplasts perform photosynthesis.
- Vacuoles: Storage sacs. Large in plant cells, small in animal cells.

Differences between Plant and Animal Cells:
- Plant cells have a rigid cell wall outside the plasma membrane.
- Plant cells have chloroplasts.
- Plant cells have a large central vacuole.
        `
    },
    {
        id: 'sst9_french_revolution',
        title: 'The French Revolution',
        subject: Subject.SST,
        classLevel: 'Class 9',
        content: `
The French Revolution began in 1789 and led to the end of monarchy in France. The society was divided into three estates: the clergy, the nobility, and the common people. The Third Estate bore the burden of taxes.

Causes of the Revolution:
- Social Inequality: The three-estate system was deeply unfair.
- Political Causes: King Louis XVI was an absolute monarch who lived in luxury while the country was in debt.
- Economic Problems: France was bankrupt from wars, and the tax system was corrupt. Poor harvests led to rising bread prices.
- Influence of Enlightenment: Philosophers like John Locke, Rousseau, and Montesquieu spread ideas of liberty, equality, and rights.

Key Events:
- Storming of the Bastille (July 14, 1789): A mob stormed the Bastille fortress, a symbol of royal power. This event marks the start of the revolution.
- Declaration of the Rights of Man and of the Citizen: A document that declared rights such as liberty, property, security, and resistance to oppression.
- Reign of Terror (1793-1794): A period led by Maximilien Robespierre where thousands were executed by the guillotine as "enemies of the revolution."
- Rise of Napoleon Bonaparte: A brilliant military general who seized power in 1799 and became Emperor of France, ending the revolution but spreading its ideals across Europe.

Legacy of the Revolution:
The French Revolution promoted the ideas of Liberty, Equality, and Fraternity. It challenged the divine right of kings and laid the foundation for modern democracies.
        `
    },
    {
        id: 'eng9_road_not_taken',
        title: 'The Road Not Taken (Poem)',
        subject: Subject.English,
        classLevel: 'Class 9',
        content: `
"The Road Not Taken" is a poem by Robert Frost. It describes a traveler who comes to a fork in a road in a yellow wood.

The Poem's Central Idea:
The speaker must choose one path, knowing he cannot travel both. He observes both paths. One is well-trodden, while the other is "grassy and wanted wear." He chooses the less-traveled one.

The speaker reflects that this choice has "made all the difference" in his life.

Themes:
- Choices and Consequences: The poem is about the choices we make in life and how they shape our future.
- Individuality: The speaker's choice of the less-traveled path symbolizes a non-conformist or individualistic spirit.
- Uncertainty: The speaker sighs as he thinks about his choice, suggesting a mix of nostalgia, satisfaction, and perhaps a bit of regret for the path he couldn't take.

Literary Devices:
- Metaphor: The two roads are a metaphor for the choices we face in life. The "yellow wood" can symbolize a phase of life, like autumn.
- Symbolism: The less-traveled road symbolizes unconventional choices and individuality.
- Imagery: The poem uses vivid imagery, such as "yellow wood" and "grassy and wanted wear," to create a clear picture in the reader's mind.
        `
    }
];
