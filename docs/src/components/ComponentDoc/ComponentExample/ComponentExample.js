import cx from 'classnames'
import copyToClipboard from 'copy-to-clipboard'
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { withRouteData, withRouter } from 'react-static'
import { Grid, Visibility } from 'semantic-ui-react'

import { examplePathToHash, repoURL, scrollToAnchor } from 'docs/src/utils'
import CarbonAdNative from 'docs/src/components/CarbonAd/CarbonAdNative'

import ComponentControls from '../ComponentControls'
import ComponentExampleRenderEditor from './ComponentExampleRenderEditor'
import ComponentExampleRenderHtml from './ComponentExampleRenderHtml'
import ComponentExampleRenderSource from './ComponentExampleRenderSource'
import ComponentExampleTitle from './ComponentExampleTitle'

const childrenStyle = {
  paddingBottom: 0,
  paddingTop: 0,
  maxWidth: '50rem',
}

const renderedExampleStyle = {
  padding: '2rem',
}

const editorStyle = {
  padding: 0,
}

const componentControlsStyle = {
  flex: '0 0 auto',
  width: 'auto',
}

/**
 * Renders a `component` and the raw `code` that produced it.
 * Allows toggling the the raw `code` code block.
 */
class ComponentExample extends PureComponent {
  static contextTypes = {
    onPassed: PropTypes.func,
  }

  static propTypes = {
    children: PropTypes.node,
    description: PropTypes.node,
    displayName: PropTypes.string.isRequired,
    exampleSources: PropTypes.objectOf(PropTypes.string).isRequired,
    examplePath: PropTypes.string.isRequired,
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    renderHtml: PropTypes.bool,
    suiVersion: PropTypes.string,
    title: PropTypes.node,
  }

  static defaultProps = {
    renderHtml: true,
  }

  constructor(props) {
    super(props)

    const originalSourceCode = props.exampleSources[props.examplePath]
    const anchorName = examplePathToHash(props.examplePath)
    const hashName = `#${anchorName}`

    this.state = {
      anchorName,
      hashName,
      originalSourceCode,
      showCode: hashName === props.location.hash,
      sourceCode: originalSourceCode,
    }
  }

  static getDerivedStateFromProps(props, state) {
    const willBeActiveHash = state.hashName === props.location.hash
    const derivedState = {
      isActiveHash: willBeActiveHash,
    }

    // deactivate examples when switching from one to the next
    if (state.isActiveHash && !willBeActiveHash) {
      derivedState.showCode = false
      derivedState.showHTML = false
    }

    return derivedState
  }

  isActiveState = () => {
    const { showCode, showHTML } = this.state

    return showCode || showHTML
  }

  updateHash = () => {
    if (this.isActiveState()) this.setHashAndScroll()
  }

  setHashAndScroll = () => {
    const { history, location } = this.props
    const { anchorName } = this.state

    history.replace(`${location.pathname}#${anchorName}`)
    scrollToAnchor()
  }

  handleDirectLinkClick = () => {
    this.setHashAndScroll()
    copyToClipboard(window && window.location.href)
  }

  handleShowCodeClick = (e) => {
    e.preventDefault()

    const { showCode } = this.state

    this.setState({ showCode: !showCode }, this.updateHash)
  }

  handleShowHTMLClick = (e) => {
    e.preventDefault()

    const { showHTML } = this.state

    this.setState({ showHTML: !showHTML }, this.updateHash)
  }

  handlePass = () => {
    const { title } = this.props

    if (title) _.invoke(this.context, 'onPassed', null, this.props)
  }

  getGithubEditHref = () => {
    const { examplePath } = this.props

    // get component name from file path:
    // elements/Button/Types/ButtonButtonExample
    const pathParts = examplePath.split(__PATH_SEP__)
    const filename = pathParts[pathParts.length - 1]

    return [
      `${repoURL}/edit/master/docs/src/examples/${examplePath}.js`,
      `?message=docs(${filename}): your description`,
    ].join('')
  }

  getKebabExamplePath = () => {
    if (!this.kebabExamplePath) {
      this.kebabExamplePath = _.kebabCase(this.props.examplePath)
    }

    return this.kebabExamplePath
  }

  handleChangeCode = _.debounce((sourceCode) => {
    this.setState({ sourceCode })
  }, 30)

  handleRenderError = (error) => this.setState({ error: error.toString() })

  handleRenderSuccess = (error, { markup }) => this.setState({ error, htmlMarkup: markup })

  render() {
    const {
      children,
      description,
      displayName,
      examplePath,
      renderHtml,
      suiVersion,
      title,
    } = this.props

    const {
      anchorName,
      error,
      htmlMarkup,
      isActiveHash,
      originalSourceCode,
      showCode,
      showHTML,
      sourceCode,
    } = this.state

    const isActive = isActiveHash || this.isActiveState()

    return (
      <Visibility
        once={false}
        onTopPassed={this.handlePass}
        onTopPassedReverse={this.handlePass}
        style={{ margin: '2rem 0' }}
      >
        {/* Ensure anchor links don't occlude card shadow effect */}
        <div id={anchorName} style={{ paddingTop: '1rem' }}>
          <Grid className={cx('docs-example', { active: isActive })} padded='vertically'>
            <Grid.Row columns='equal'>
              <Grid.Column>
                <ComponentExampleTitle
                  description={description}
                  title={title}
                  suiVersion={suiVersion}
                />
              </Grid.Column>
              <Grid.Column textAlign='right' style={componentControlsStyle}>
                <ComponentControls
                  anchorName={anchorName}
                  disableHtml={!renderHtml}
                  exampleCode={sourceCode}
                  examplePath={examplePath}
                  onCopyLink={this.handleDirectLinkClick}
                  onShowCode={this.handleShowCodeClick}
                  onShowHTML={this.handleShowHTMLClick}
                  showCode={showCode}
                  showHTML={showHTML}
                />
              </Grid.Column>
            </Grid.Row>

            {children && (
              <Grid.Row columns={1} style={childrenStyle}>
                <Grid.Column>{children}</Grid.Column>
              </Grid.Row>
            )}

            <Grid.Column
              width={16}
              className={`rendered-example ${this.getKebabExamplePath()}`}
              style={renderedExampleStyle}
            >
              <ComponentExampleRenderSource
                displayName={displayName}
                onError={this.handleRenderError}
                onSuccess={this.handleRenderSuccess}
                renderHtml={renderHtml}
                sourceCode={sourceCode}
              />
            </Grid.Column>
            {(showCode || showHTML) && (
              <Grid.Column width={16} style={editorStyle}>
                {showCode && (
                  <ComponentExampleRenderEditor
                    githubEditHref={this.getGithubEditHref()}
                    originalValue={originalSourceCode}
                    value={sourceCode}
                    error={error}
                    onChange={this.handleChangeCode}
                  />
                )}
                {showHTML && <ComponentExampleRenderHtml value={htmlMarkup} />}
              </Grid.Column>
            )}
            {isActive && !error && <CarbonAdNative inverted={this.isActiveState()} />}
          </Grid>
        </div>
      </Visibility>
    )
  }
}

export default withRouteData(withRouter(ComponentExample))
