import { toBlob } from 'html-to-image';

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

export const extractAndCopyMathML = async (containerId: string): Promise<boolean> => {
  const container = document.getElementById(containerId);
  if (!container) return false;

  const mathElements = container.querySelectorAll('math');
  
  if (mathElements.length === 0) return false;

  let combinedMathML = '';

  mathElements.forEach((el) => {
    combinedMathML += el.outerHTML + '\n\n';
  });

  try {
    await navigator.clipboard.writeText(combinedMathML);
    return true;
  } catch (err) {
    console.error('Failed to copy MathML: ', err);
    return false;
  }
};

export const copyNodeAsImage = async (nodeId: string): Promise<boolean> => {
  const node = document.getElementById(nodeId);
  if (!node) return false;

  try {
    const filter = (node: HTMLElement) => {
      const exclusionClasses = ['exclude-from-capture'];
      return !exclusionClasses.some((classname) => node.classList?.contains(classname));
    };

    const blob = await toBlob(node, {
      backgroundColor: '#ffffff',
      style: {
        color: '#000000',
        padding: '20px',
      },
      filter: filter,
      pixelRatio: 2,
    });

    if (!blob) throw new Error('Blob generation failed');

    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);
    return true;
  } catch (err) {
    console.error('Failed to copy image: ', err);
    return false;
  }
};

export const cleanLatex = (input: string): string => {
  let cleaned = input;
  cleaned = cleaned.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
  cleaned = cleaned.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
  return cleaned;
};