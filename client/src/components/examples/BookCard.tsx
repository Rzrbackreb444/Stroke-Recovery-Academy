import BookCard from '../BookCard';
import bookCoverImage from "@assets/generated_images/sasquatch_recovery_book_cover.png";

export default function BookCardExample() {
  return (
    <div className="max-w-sm">
      <BookCard
        title="If The Sasquatch Can Do It, So Can You!"
        subtitle="How an Arkansas Boy Who Couldn't Read Proved That Impossible Recovery is Actually Inevitable"
        pageCount={334}
        chapterCount={28}
        readingTime="8-10 hours"
        coverImage={bookCoverImage}
        preview="A survivor-led stroke recovery book drawn from Nick's reported 0%-to-90% personal story. Honest reflection and practical ideas, not a clinical protocol or proof of a promised outcome."
        onClick={() => console.log("Read book clicked")}
      />
    </div>
  );
}
