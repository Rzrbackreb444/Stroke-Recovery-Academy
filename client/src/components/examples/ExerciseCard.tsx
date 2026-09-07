import ExerciseCard from '../ExerciseCard';
import baseballBatImage from "@assets/generated_images/baseball_bat_therapy_equipment.png";

export default function ExerciseCardExample() {
  return (
    <div className="max-w-sm">
      <ExerciseCard
        title="Baseball Bat Therapy"
        description="A personal practice prop, not a secret weapon or replacement for clinical equipment. Use progressive strength and balance activities only with appropriate guidance."
        difficulty="Intermediate"
        bodyArea={["Arm", "Balance", "Proprioception"]}
        duration="15-20 min"
        imageUrl={baseballBatImage}
        onClick={() => console.log("Baseball Bat Therapy clicked")}
      />
    </div>
  );
}
