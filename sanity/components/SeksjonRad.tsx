// List row for page and front page sections: the normal row plus a show/hide switch on the right, so a section can be
// taken off the site without deleting it. A hidden row is dimmed and marked «Skjult». Sets the section's `skjult` field.
import { set, unset, type ObjectItemProps } from 'sanity';
import { Badge, Box, Flex, Switch, Text } from '@sanity/ui';
import { Tooltip } from '@sanity/ui/tooltip';

export function SeksjonRad(props: ObjectItemProps) {
  const skjult = (props.value as { skjult?: boolean }).skjult === true;
  const bytt = () => props.inputProps.onChange(skjult ? unset(['skjult']) : set(true, ['skjult']));
  return (
    <Flex align="center" gap={2}>
      <Box flex={1} style={{ minWidth: 0, opacity: skjult ? 0.45 : 1, transition: 'opacity 150ms' }}>{props.renderDefault(props)}</Box>
      {skjult && <Badge tone="caution">Skjult</Badge>}
      <Tooltip content={<Box padding={2}><Text size={1}>{skjult ? 'Skjult på nettsiden. Slå på for å vise.' : 'Vises på nettsiden. Slå av for å skjule.'}</Text></Box>} placement="left" portal>
        <Box paddingRight={1}>
          <Switch checked={!skjult} onChange={bytt} disabled={props.readOnly} aria-label={skjult ? 'Vis seksjonen på nettsiden' : 'Skjul seksjonen på nettsiden'} />
        </Box>
      </Tooltip>
    </Flex>
  );
}
