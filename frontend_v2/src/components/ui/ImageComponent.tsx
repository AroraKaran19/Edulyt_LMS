import { cn } from "@/lib/utils";
import Image, { ImageProps } from "next/image";

const ImageComponent = (props: ImageProps) => {
  return (
    <Image
      {...props}
      draggable={false}
      unoptimized
      unselectable="on"
      quality={100}
      className={cn(props.className, "select-none")}
    />
  );
};

export default ImageComponent;
