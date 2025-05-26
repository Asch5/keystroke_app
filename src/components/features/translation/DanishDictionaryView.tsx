// import React from 'react';
// import { DanishDictionaryObject } from '@/core/types/translationDanishTypes';
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Button } from '@/components/ui/button';
// import { Volume2 } from 'lucide-react';

// interface DanishDictionaryViewProps {
//   data: DanishDictionaryObject;
// }

// export function DanishDictionaryView({ data }: DanishDictionaryViewProps) {
//   const playAudio = () => {
//     if (data.word.audio) {
//       const audio = new Audio(data.word.audio);
//       audio.play().catch((error) => {
//         console.error('Error playing audio:', error);
//       });
//     }
//   };

//   return (
//     <Card className="w-full max-w-3xl mx-auto">
//       <CardHeader>
//         <div className="flex items-center justify-between">
//           <div>
//             <CardTitle className="text-2xl">{data.word.word}</CardTitle>
//             <CardDescription className="text-lg">
//               [{data.word.phonetic}]
//             </CardDescription>
//           </div>
//           <Button variant="outline" size="icon" onClick={playAudio}>
//             <Volume2 className="h-4 w-4" />
//           </Button>
//         </div>
//         <div className="flex gap-2 mt-2">
//           {data.word.partOfSpeech.noun.is_noun && <Badge>noun</Badge>}
//           {data.word.partOfSpeech.verb.is_verb && <Badge>verb</Badge>}
//           {data.word.partOfSpeech.adjective.is_adjective && (
//             <Badge>adjective</Badge>
//           )}
//           {data.word.partOfSpeech.is_adverb && <Badge>adverb</Badge>}
//           {data.word.partOfSpeech.is_preposition && <Badge>preposition</Badge>}
//           {data.word.partOfSpeech.is_conjunction && <Badge>conjunction</Badge>}
//         </div>
//       </CardHeader>
//       <CardContent>
//         <Tabs defaultValue="definition">
//           <TabsList className="grid w-full grid-cols-4">
//             <TabsTrigger value="definition">Definition</TabsTrigger>
//             <TabsTrigger value="grammar">Grammar</TabsTrigger>
//             <TabsTrigger value="expressions">Expressions</TabsTrigger>
//             <TabsTrigger value="related">Related</TabsTrigger>
//           </TabsList>

//           <TabsContent value="definition" className="space-y-4">
//             <div className="mt-4">
//               <h3 className="font-medium text-lg mb-2">Definition</h3>
//               <p>{data.definition.definition}</p>

//               {data.definition.examples.length > 0 && (
//                 <div className="mt-4">
//                   <h4 className="font-medium mb-2">Examples</h4>
//                   <ul className="space-y-2">
//                     {data.definition.examples.map((example, index) => (
//                       <li key={index} className="ml-4">
//                         <p className="italic">• {example.example}</p>
//                         {example.translation && (
//                           <p className="text-muted-foreground text-sm ml-4">
//                             {example.translation}
//                           </p>
//                         )}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//             </div>
//           </TabsContent>

//           <TabsContent value="grammar" className="space-y-4">
//             {data.word.partOfSpeech.noun.is_noun && (
//               <div>
//                 <h3 className="font-medium text-lg mb-2">Noun Forms</h3>
//                 <div className="grid grid-cols-2 gap-2">
//                   <div className="p-2 border rounded">
//                     <span className="text-sm text-muted-foreground">
//                       Definite:
//                     </span>
//                     <p>{data.word.partOfSpeech.noun.definite_form_da}</p>
//                   </div>
//                   <div className="p-2 border rounded">
//                     <span className="text-sm text-muted-foreground">
//                       Plural:
//                     </span>
//                     <p>{data.word.partOfSpeech.noun.plural_da}</p>
//                   </div>
//                   <div className="p-2 border rounded">
//                     <span className="text-sm text-muted-foreground">
//                       Plural Definite:
//                     </span>
//                     <p>{data.word.partOfSpeech.noun.plural_definite_da}</p>
//                   </div>
//                   <div className="p-2 border rounded">
//                     <span className="text-sm text-muted-foreground">
//                       Gender:
//                     </span>
//                     <p>
//                       {data.word.partOfSpeech.noun.common_gender_da
//                         ? 'Common (en)'
//                         : data.word.partOfSpeech.noun.neuter_gender_da
//                           ? 'Neuter (et)'
//                           : ''}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {data.word.partOfSpeech.verb.is_verb && (
//               <div>
//                 <h3 className="font-medium text-lg mb-2">Verb Forms</h3>
//                 <div className="grid grid-cols-2 gap-2">
//                   <div className="p-2 border rounded">
//                     <span className="text-sm text-muted-foreground">
//                       Present:
//                     </span>
//                     <p>{data.word.partOfSpeech.verb.present_tense_da}</p>
//                   </div>
//                   <div className="p-2 border rounded">
//                     <span className="text-sm text-muted-foreground">Past:</span>
//                     <p>{data.word.partOfSpeech.verb.past_tense_da}</p>
//                   </div>
//                   <div className="p-2 border rounded">
//                     <span className="text-sm text-muted-foreground">
//                       Past Participle:
//                     </span>
//                     <p>{data.word.partOfSpeech.verb.past_participle_da}</p>
//                   </div>
//                   <div className="p-2 border rounded">
//                     <span className="text-sm text-muted-foreground">
//                       Imperative:
//                     </span>
//                     <p>{data.word.partOfSpeech.verb.imperative_da}</p>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {data.word.partOfSpeech.adjective.is_adjective && (
//               <div>
//                 <h3 className="font-medium text-lg mb-2">Adjective Forms</h3>
//                 <div className="grid grid-cols-2 gap-2">
//                   <div className="p-2 border rounded">
//                     <span className="text-sm text-muted-foreground">
//                       Neuter:
//                     </span>
//                     <p>
//                       {data.word.partOfSpeech.adjective.adjective_neuter_da}
//                     </p>
//                   </div>
//                   <div className="p-2 border rounded">
//                     <span className="text-sm text-muted-foreground">
//                       Plural:
//                     </span>
//                     <p>
//                       {data.word.partOfSpeech.adjective.adjective_plural_da}
//                     </p>
//                   </div>
//                   <div className="p-2 border rounded">
//                     <span className="text-sm text-muted-foreground">
//                       Comparative:
//                     </span>
//                     <p>{data.word.partOfSpeech.adjective.comparative_da}</p>
//                   </div>
//                   <div className="p-2 border rounded">
//                     <span className="text-sm text-muted-foreground">
//                       Superlative:
//                     </span>
//                     <p>{data.word.partOfSpeech.adjective.superlative_da}</p>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {data.word.etymology && (
//               <div>
//                 <h3 className="font-medium text-lg mb-2">Etymology</h3>
//                 <p>{data.word.etymology}</p>
//               </div>
//             )}
//           </TabsContent>

//           <TabsContent value="expressions">
//             {data.fixed_expressions.length > 0 ? (
//               <div className="space-y-4 mt-4">
//                 {data.fixed_expressions.map((expression, index) => (
//                   <div key={index} className="border rounded p-4">
//                     <h3 className="font-medium text-lg">
//                       {expression.fixed_expression}
//                     </h3>
//                     <p className="mt-1">{expression.definition}</p>

//                     {expression.examples.length > 0 && (
//                       <div className="mt-3">
//                         <h4 className="font-medium text-sm text-muted-foreground mb-1">
//                           Examples:
//                         </h4>
//                         <ul className="space-y-2">
//                           {expression.examples.map((example, exIndex) => (
//                             <li key={exIndex} className="ml-4">
//                               <p className="italic">• {example.example}</p>
//                               {example.translation && (
//                                 <p className="text-muted-foreground text-sm ml-4">
//                                   {example.translation}
//                                 </p>
//                               )}
//                             </li>
//                           ))}
//                         </ul>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p className="py-4 text-center text-muted-foreground">
//                 No fixed expressions available.
//               </p>
//             )}
//           </TabsContent>

//           <TabsContent value="related">
//             <div className="space-y-4 mt-4">
//               {data.synonyms.length > 0 && (
//                 <div>
//                   <h3 className="font-medium text-lg mb-2">Synonyms</h3>
//                   <div className="flex flex-wrap gap-2">
//                     {data.synonyms.map((synonym, index) => (
//                       <Badge key={index} variant="secondary">
//                         {synonym}
//                       </Badge>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {data.antonyms.length > 0 && (
//                 <div>
//                   <h3 className="font-medium text-lg mb-2">Antonyms</h3>
//                   <div className="flex flex-wrap gap-2">
//                     {data.antonyms.map((antonym, index) => (
//                       <Badge key={index} variant="outline">
//                         {antonym}
//                       </Badge>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {data.related_words.length > 0 && (
//                 <div>
//                   <h3 className="font-medium text-lg mb-2">Related Words</h3>
//                   <div className="flex flex-wrap gap-2">
//                     {data.related_words.map((relatedWord, index) => (
//                       <Badge
//                         key={index}
//                         variant="secondary"
//                         className="bg-primary/10"
//                       >
//                         {relatedWord}
//                       </Badge>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {data.synonyms.length === 0 &&
//                 data.antonyms.length === 0 &&
//                 data.related_words.length === 0 && (
//                   <p className="py-4 text-center text-muted-foreground">
//                     No related words available.
//                   </p>
//                 )}
//             </div>
//           </TabsContent>
//         </Tabs>
//       </CardContent>
//       <CardFooter className="flex justify-between">
//         <Button variant="outline">Add to My Dictionary</Button>
//         <Button>Learn This Word</Button>
//       </CardFooter>
//     </Card>
//   );
// }
