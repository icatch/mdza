import React, { Component } from 'react'
import styled from 'styled-components'
import { createObserver, collect } from 'dop'

import styles from '/const/styles'
import { ASSET_LOGO } from '/const/'
import routes from '/router/routes'

import { getRandomArbitrary } from '/api/numbers'
import { Coins } from '/api/coins'
import { isAddress } from '/api/coins/ETH'
import {
    getNameContract,
    getSymbolContract,
    getDecimalsContract
} from '/api/coins/ERC20'

import state from '/store/state'
import { createCustomERC20, setHref } from '/store/actions'

import H1 from '/components/styled/H1'
import H2 from '/components/styled/H2'
import {
    RightContainerPadding,
    RightHeader,
    RightContent
} from '/components/styled/Right'
import Div from '/components/styled/Div'
import Input from '/components/styled/Input'
import Help from '/components/styled/Help'
import Button from '/components/styled/Button'
import { Label, SubLabel } from '/components/styled/Label'
import IconHeader from '/components/styled/IconHeader'
import {
    FormField,
    FormFieldLeft,
    FormFieldRight,
    FormFieldButtons
} from '/components/styled/Form'

export default class ImportBitcoin extends Component {
    componentWillMount() {
        this.observer = createObserver(m => this.forceUpdate())
        this.observer.observe(state.view)

        // Initial state
        state.view = {
            fetching: false,
            contract_address: '',
            symbol: '',
            name: '',
            coin_decimals: 18,
            color: (
                '#' +
                getRandomArbitrary(30, 255).toString(16) +
                getRandomArbitrary(30, 255).toString(16) +
                getRandomArbitrary(30, 255).toString(16)
            ).toUpperCase(),

            contract_address_error: '',
            symbol_error: '',
            name_error: '',
            coin_decimals_error: '',
            color_error: ''
        }

        // binding
        this.onChangeAddress = this.onChangeAddress.bind(this)
        this.onChangeSymbol = this.onChangeSymbol.bind(this)
        this.onChangeName = this.onChangeName.bind(this)
        this.onChangeDecimals = this.onChangeDecimals.bind(this)
        this.onChangeColor = this.onChangeColor.bind(this)
        this.onSubmit = this.onSubmit.bind(this)
    }
    componentWillUnmount() {
        this.observer.destroy()
    }
    shouldComponentUpdate() {
        return false
    }

    onChangeAddress(value) {
        const contract_address = value.trim()
        if (state.view.contract_address !== contract_address) {
            const collector = collect()
            state.view.contract_address = contract_address
            if (isAddress(contract_address)) {
                let nulls = 0
                state.view.contract_address_error = ''
                state.view.fetching = true
                getSymbolContract(contract_address)
                    .then(result => {
                        if (result !== null) this.onChangeSymbol(result)
                        else nulls += 1
                        return getNameContract(contract_address)
                    })
                    .then(result => {
                        if (result !== null) this.onChangeName(result)
                        else nulls += 1
                        return getDecimalsContract(contract_address)
                    })
                    .then(result => {
                        const collector = collect()
                        state.view.fetching = false
                        if (result !== null) this.onChangeDecimals(result)
                        else if (nulls === 2) {
                            state.view.contract_address_error =
                                'Seems like this address is not an ERC20 contract.'
                        }
                        collector.emit()
                    })
            } else {
                state.view.contract_address_error = 'Invalid address'
            }
            collector.emit()
        }
    }

    onChangeSymbol(value) {
        const symbol = value.trim().toUpperCase()
        const collector = collect()
        state.view.symbol = symbol
        state.view.symbol_error = Coins.hasOwnProperty(symbol)
            ? 'Duplicated symbol.'
            : ''
        collector.emit()
        // // Loading possible icon
        // if (symbol.length > 2) {
        //     const img = new Image()
        //     const url = `https://cryptocoincharts.info/img/coins/${symbol.toLowerCase()}.svg`
        //     img.onload = () => {
        //         console.log(arguments, img)
        //     }
        //     img.src = url
        // }
    }

    onChangeName(value) {
        state.view.name = value.trim()
    }

    onChangeDecimals(value) {
        const coin_decimals = Number(value)
        const collector = collect()
        state.view.coin_decimals = value
        state.view.coin_decimals_error = isNaN(coin_decimals)
            ? 'Invalid number'
            : ''
        collector.emit()
    }

    onChangeColor(value) {
        // state.view.color = value.trim()
        const color = value.trim()
        const collector = collect()
        state.view.color = value.toUpperCase()
        state.view.color_error = !/^#[0-9a-fA-F]{3,6}$/.test(color)
            ? 'Invalid color'
            : ''
        collector.emit()
    }

    onSubmit(e) {
        e.preventDefault()
        createCustomERC20({
            symbol: state.view.symbol,
            name: state.view.name,
            color: state.view.color,
            contract_address: state.view.contract_address,
            coin_decimals: Number(state.view.coin_decimals),
            labels: `${state.view.symbol.toLowerCase()} ethereum token erc20 ecr20`,
            logo: ASSET_LOGO('ERC20')
        })
        setHref(routes.add())
    }

    get isValidForm() {
        return (
            state.view.fetching === false &&
            state.view.contract_address.length > 0 &&
            state.view.contract_address_error === '' &&
            state.view.symbol.length > 0 &&
            state.view.symbol_error === '' &&
            state.view.name.length > 0 &&
            state.view.name_error === '' &&
            state.view.coin_decimals > 0 &&
            state.view.coin_decimals_error === '' &&
            state.view.color.length > 0 &&
            state.view.color_error === ''
        )
    }

    render() {
        return React.createElement(ImportTemplate, {
            fetching: state.view.fetching,
            contract_address: state.view.contract_address,
            symbol: state.view.symbol,
            name: state.view.name,
            coin_decimals: state.view.coin_decimals,
            color: state.view.color,

            contract_address_error: state.view.contract_address_error,
            symbol_error: state.view.symbol_error,
            name_error: state.view.name_error,
            coin_decimals_error: state.view.coin_decimals_error,
            color_error: state.view.color_error,

            isValidForm: this.isValidForm,

            onChangeAddress: this.onChangeAddress,
            onChangeSymbol: this.onChangeSymbol,
            onChangeName: this.onChangeName,
            onChangeDecimals: this.onChangeDecimals,
            onChangeColor: this.onChangeColor,
            onSubmit: this.onSubmit
        })
    }
}

function ImportTemplate({
    fetching,
    contract_address,
    symbol,
    name,
    coin_decimals,
    color,

    contract_address_error,
    symbol_error,
    name_error,
    coin_decimals_error,
    color_error,

    isValidForm,

    onChangeAddress,
    onChangeSymbol,
    onChangeName,
    onChangeDecimals,
    onChangeColor,
    onSubmit
}) {
    return (
        <RightContainerPadding>
            <RightHeader>
                <IconHeader>
                    <img src="/static/image/coins/ERC20.svg" />
                </IconHeader>
                <Div float="left">
                    <H1>ERC20</H1>
                    <H2>Create custom ERC20 token</H2>
                </Div>
                <Div clear="both" />
            </RightHeader>
            <RightContent>
                <Div>
                    <form>
                        <FormField>
                            <FormFieldLeft>
                                <Label>Contract Address</Label>
                                <SubLabel>An ERC20 contract address.</SubLabel>
                            </FormFieldLeft>
                            <FormFieldRight>
                                <Input
                                    rightIco={
                                        fetching
                                            ? '/static/image/loading.gif'
                                            : null
                                    }
                                    value={contract_address}
                                    width="100%"
                                    error={contract_address_error}
                                    invalid={contract_address_error}
                                    onChange={e =>
                                        onChangeAddress(e.target.value)
                                    }
                                />
                            </FormFieldRight>
                        </FormField>

                        <FormField>
                            <FormFieldLeft>
                                <Label>Symbol</Label>
                                <Help>
                                    Three or more letters that represent this
                                    asset. The symbol of Bitcoin is BTC.
                                </Help>
                                <SubLabel>Letters and Numbers only.</SubLabel>
                            </FormFieldLeft>
                            <FormFieldRight>
                                <Input
                                    maxLength="5"
                                    value={symbol}
                                    width="100%"
                                    error={symbol_error}
                                    invalid={symbol_error}
                                    onChange={e =>
                                        onChangeSymbol(e.target.value)
                                    }
                                />
                            </FormFieldRight>
                        </FormField>

                        <FormField>
                            <FormFieldLeft>
                                <Label>Name / Title</Label>
                            </FormFieldLeft>
                            <FormFieldRight>
                                <Input
                                    maxLength="30"
                                    value={name}
                                    width="100%"
                                    error={name_error}
                                    invalid={name_error}
                                    onChange={e => onChangeName(e.target.value)}
                                />
                            </FormFieldRight>
                        </FormField>

                        <FormField>
                            <FormFieldLeft>
                                <Label>Decimals</Label>
                                <SubLabel>
                                    Must be the number defined in the contract.
                                </SubLabel>
                            </FormFieldLeft>
                            <FormFieldRight>
                                <Input
                                    maxLength="2"
                                    value={coin_decimals}
                                    width="100%"
                                    error={coin_decimals_error}
                                    invalid={coin_decimals_error}
                                    onChange={e =>
                                        onChangeDecimals(e.target.value)
                                    }
                                />
                            </FormFieldRight>
                        </FormField>

                        <FormField>
                            <FormFieldLeft>
                                <Label>Color</Label>
                            </FormFieldLeft>
                            <FormFieldRight>
                                <Input
                                    maxLength="7"
                                    color={color}
                                    value={color}
                                    width="100%"
                                    error={color_error}
                                    invalid={color_error}
                                    onChange={e =>
                                        onChangeColor(e.target.value)
                                    }
                                />
                                <Color color={color} />
                            </FormFieldRight>
                        </FormField>

                        <FormField>
                            <FormFieldButtons>
                                <Button
                                    width="100px"
                                    disabled={!isValidForm}
                                    onClick={onSubmit}
                                >
                                    Create
                                </Button>
                            </FormFieldButtons>
                        </FormField>
                    </form>
                </Div>
            </RightContent>
        </RightContainerPadding>
    )
}

const Color = styled.div`
    border-radius: 50%;
    position: absolute;
    right: 4.5px;
    top: 4.5px;
    width: 30px;
    height: 30px;
    background: ${props => props.color};
`