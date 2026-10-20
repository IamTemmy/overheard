export const CHARACTERS=['Marlowe','Ines','Vale','Dutch','Rook','Sol'];
export const VOICES={Marlowe:'Bold, jokey tycoon; sometimes too obvious. Rejected proposal; owns half the mall.',Ines:'Precise, nervous engineer; layered references. Elevator ordeal; repaired backup generator.',Vale:'Dramatic heiress; cryptic but helpful. Library ban; hospital donor.',Dutch:'Terse veteran; dry humor and decoys. Terrible coffee habit; brother works stadium nights.',Rook:'Chatty bike courier, optimistic improviser. Collects lost socks; names every pigeon.',Sol:'Deadpan night-shift radio DJ. Carries emergency glitter; refuses to sing on request.'};
// Four situated stories per node. Tells are warnings, never a list supplied to the Listener.
const content={
 'Radio Tower':{tells:['radio','tower','antenna','broadcast'],stories:[
 'Sol broadcast a lullaby by mistake; Dutch was asleep before the second verse.',
 'Ines climbed with a rubber duck in her pocket, insisting it was the supervisor.',
 'Marlowe announced his own birthday on air; the only caller asked him to stop.',
 'Rook renamed the antenna Gerald and demanded we say goodnight to it.']},
 Church:{tells:['church','bells','pew','choir'],stories:[
 'Vale hid emergency glitter under a pew; Dutch sneezed through the entire ceremony.',
 'Rook rang the bells for a lost pigeon and accidentally announced a wedding.',
 'Sol taught the choir a jingle for soup. Nobody noticed until the third bowl.',
 'Marlowe brought a pineapple as his apology; the minister asked for a receipt.']},
 'Power Plant':{tells:['generator','power','plant','turbine'],stories:[
 'Ines repaired the backup generator while Dutch held her lucky oven mitt.',
 'Rook challenged a turbine to a staring contest. Sol kept score for an hour.',
 'Vale arrived wearing velvet slippers; the safety officer gave them tiny helmets.',
 'Marlowe called a sparking cable spicy spaghetti until Ines confiscated his fork.']},
 Library:{tells:['library','books','librarian','shelves'],stories:[
 'Vale was banned for narrating her own dramatic entrance between the shelves.',
 'Dutch returned a book with a pancake as a bookmark. Rook asked for the recipe.',
 'Sol whispered a joke so quietly that Ines laughed three days later.',
 'Marlowe tried paying a late fee with invisible cake. The librarian was unmoved.']},
 Hospital:{tells:['hospital','nurse','patient','ward'],stories:[
 'Vale donated a new wing and insisted the opening ribbon be cut with left-handed scissors.',
 'Dutch brought a patient a cactus called Cuddles; the nurse made him rename it.',
 'Ines wore mismatched socks for luck; Rook wrote them a formal peace treaty.',
 'Sol played a kazoo to cheer Marlowe up. He asked for a second opinion.']},
 Diner:{tells:['diner','coffee','waitress','pancakes'],stories:[
 'Dutch drank four cups of terrible coffee and thanked each cup individually.',
 'Marlowe ordered pancakes shaped like his face. Vale said they looked more honest.',
 'Rook introduced a spoon as his uncle; the waitress offered him a family discount.',
 'Ines lost a bet and wore a paper crown saying Deputy Pickle until closing.']},
 'East Line Station':{tells:['station','elevator','train','platform'],stories:[
 'Ines was stuck in the elevator for three hours with a mariachi band.',
 'Rook missed his train while explaining modern art to a very unimpressed pigeon.',
 'Vale bought seven identical tickets because six looked lonely.',
 'Dutch ate a birthday cupcake on the platform and refused to reveal whose birthday.']},
 Stadium:{tells:['stadium','goalposts','pitch','scoreboard'],stories:[
 'Dutch brought his brother a tiny trumpet for the night shift; it could play one angry note.',
 'Sol challenged the mascot to a dance-off and lost to a spectacularly slow shuffle.',
 'Ines repaired the scoreboard while Marlowe shouted imaginary scores in Latin.',
 'Rook sold Vale a lucky shoelace. Her team lost but her shoes stayed tied.']},
 Docks:{tells:['docks','boat','water','pier'],stories:[
 'Marlowe opened a purple umbrella on a boat. The rain found only him.',
 'Rook tried teaching a seagull disco; Sol claimed it charged tuition.',
 'Dutch rescued a floating melon, wrapped it in a towel and called it Admiral.',
 'Vale christened a tiny vessel with expensive lemonade and drank the rest herself.']},
 'Ferris Wheel':{tells:['ferris','wheel','gondola','ride'],stories:[
 'Marlowe proposed at the top. She said no; Rook kept the celebratory confetti.',
 'Sol rode with a jar of marmalade and declared herself its captain.',
 'Dutch wore sunglasses at midnight so nobody could see him negotiating with gravity.',
 'Ines counted every bolt twice while Vale practiced her royal wave.']},
 Bridge:{tells:['bridge','river','crossing','railing'],stories:[
 'Rook dropped his left sock over the railing and demanded a minute of silence.',
 'Sol and Ines argued about whether echoes owe royalties to the original speaker.',
 'Marlowe attempted a heroic cape flourish and slapped himself with the cape.',
 'Vale organized a tiny parade for Dutch, who was only trying to get home.']},
 Mall:{tells:['mall','shop','escalator','food court'],stories:[
 'Marlowe got lost in the half he owns and asked a mannequin for directions.',
 'Vale bought a velvet potato and insisted it was her emotional support vegetable.',
 'Ines scheduled seven Tuesdays on a display calendar; Rook attended all of them.',
 'Sol rode the escalator carrying emergency glitter. Dutch took the stairs for a week.']}
};
export const STORIES=Object.entries(content).flatMap(([node,{tells,stories}])=>stories.map((story,i)=>({id:`${node}-${i+1}`,node,story,tells})));
