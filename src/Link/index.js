import React from 'react';
import PropTypes from 'prop-types';
import { svg, select } from 'd3';

import './style.css';

export default class Link extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      initialStyle: {
        opacity: 0,
      },
      activated: false,
    };
  }

  componentDidMount() {
    this.applyOpacity(1, this.props.transitionDuration);
  }

  componentWillLeave(done) {
    this.applyOpacity(0, this.props.transitionDuration, done);
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.activated !== this.props.activated &&
      nextProps.activated.indexOf(this.props.linkData.target.name) > -1
    ) {
      this.setState({ activated: true });
    }
  }

  applyOpacity(opacity, transitionDuration, done = () => {}) {
    if (transitionDuration === 0) {
      select(this.link).style('opacity', opacity);
      done();
    } else {
      select(this.link)
        .transition()
        .duration(transitionDuration)
        .style('opacity', opacity)
        .each('end', done);
    }
  }

  diagonalPath(linkData, orientation) {
    const diagonal = svg
      .diagonal()
      .projection(d => (orientation === 'horizontal' ? [d.y, d.x] : [d.x, d.y]));
    return diagonal(linkData);
  }

  straightPath(linkData, orientation) {
    const straight = svg
      .line()
      .interpolate('basis')
      .x(d => d.x)
      .y(d => d.y);

    let data = [
      { x: linkData.source.x, y: linkData.source.y },
      { x: linkData.target.x, y: linkData.target.y },
    ];

    if (orientation === 'horizontal') {
      data = [
        { x: linkData.source.y, y: linkData.source.x },
        { x: linkData.target.y, y: linkData.target.x },
      ];
    }

    return straight(data);
  }

  circuitPath(d) {
    const children = d.source._children;
    const index = children.map(n => n.name).indexOf(d.target.name);
    const multiplier = index === children.length - 1 ? Math.random() : index + 1 + Math.random();
    const a = (d.target.y - d.source.y) / (children.length + 1) * multiplier + d.source.y;
    const b = a + Math.abs(d.target.x - d.source.x);
    return `M${d.source.y},${d.source.x}H${a}L${b > d.target.y ? d.target.y : b},${d.target.x}H${d
      .target.y}`;
  }

  elbowPath(d, orientation) {
    return orientation === 'horizontal'
      ? `M${d.source.y},${d.source.x}V${d.target.x}H${d.target.y}`
      : `M${d.source.x},${d.source.y}V${d.target.y}H${d.target.x}`;
  }

  drawPath() {
    const { linkData, orientation, pathFunc } = this.props;

    if (typeof pathFunc === 'function') {
      return pathFunc(linkData, orientation);
    }

    if (pathFunc === 'circuit') {
      return this.circuitPath(linkData, orientation);
    }

    if (pathFunc === 'elbow') {
      return this.elbowPath(linkData, orientation);
    }

    if (pathFunc === 'straight') {
      return this.straightPath(linkData, orientation);
    }

    return this.diagonalPath(linkData, orientation);
  }

  render() {
    const { styles } = this.props;
    const { activated } = this.state;
    return (
      <path
        ref={l => {
          this.link = l;
        }}
        style={{ ...this.state.initialStyle, ...styles }}
        className={activated ? 'activeLink linkBase' : 'linkBase'}
        d={this.drawPath()}
      />
    );
  }
}

Link.defaultProps = {
  styles: {},
  activated: [],
};

Link.propTypes = {
  linkData: PropTypes.object.isRequired,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']).isRequired,
  pathFunc: PropTypes.oneOfType([
    PropTypes.oneOf(['diagonal', 'elbow', 'straight', 'circuit']),
    PropTypes.func,
  ]).isRequired,
  transitionDuration: PropTypes.number.isRequired,
  styles: PropTypes.object,
  activated: PropTypes.array,
};
